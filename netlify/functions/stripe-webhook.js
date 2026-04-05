const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Verify the request actually came from Stripe
  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      event.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return { statusCode: 400, body: `Webhook error: ${err.message}` }
  }

  try {
    switch (stripeEvent.type) {

      // User completed checkout — activate subscription
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

      // Subscription renewed, updated, or changed
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
          // Fallback: find user by stripe customer ID
          await supabase.from('profiles').update({
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }).eq('stripe_customer_id', subscription.customer)
        }
        break
      }

      // Subscription cancelled — lock them out
      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object

        await supabase.from('profiles').update({
          subscription_status: 'canceled',
        }).eq('stripe_customer_id', subscription.customer)
        break
      }

      // Payment failed — mark as past_due
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received: true }),
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
