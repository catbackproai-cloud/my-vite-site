import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: false } }

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const rawBody = await getRawBody(req)

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook error: ${err.message}`)
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object
        if (session.mode !== 'subscription') break
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        const userId = session.metadata?.userId
        if (userId) {
          await supabase.from('profiles').update({
            subscription_status: subscription.status,
            subscription_id: subscription.id,
            stripe_customer_id: session.customer,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }).eq('id', userId)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object
        const userId = subscription.metadata?.userId
        if (userId) {
          await supabase.from('profiles').update({
            subscription_status: subscription.status,
            subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }).eq('id', userId)
        } else {
          await supabase.from('profiles').update({
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }).eq('stripe_customer_id', subscription.customer)
        }
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object
        await supabase.from('profiles').update({
          subscription_status: 'canceled',
        }).eq('stripe_customer_id', subscription.customer)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object
        if (!invoice.subscription) break
        await supabase.from('profiles').update({
          subscription_status: 'past_due',
        }).eq('stripe_customer_id', invoice.customer)
        break
      }
      default:
        break
    }

    res.status(200).json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    res.status(500).json({ error: err.message })
  }
}
