import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { sessionId, userId } = req.body
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' })
    }

    const subscription = await stripe.subscriptions.retrieve(session.subscription)
    await supabase.from('profiles').update({
      subscription_status: subscription.status,
      subscription_id: subscription.id,
      stripe_customer_id: session.customer,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    }).eq('id', userId)

    res.status(200).json({ status: subscription.status })
  } catch (err) {
    console.error('verify-checkout error:', err)
    res.status(500).json({ error: err.message })
  }
}
