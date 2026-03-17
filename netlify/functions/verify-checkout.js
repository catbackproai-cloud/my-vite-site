const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }

  try {
    const { sessionId, userId } = JSON.parse(event.body)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Payment not completed' }) }
    }

    const subscription = await stripe.subscriptions.retrieve(session.subscription)
    await supabaseAdmin.from('profiles').update({
      subscription_status: subscription.status,
      subscription_id: subscription.id,
      stripe_customer_id: session.customer,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    }).eq('id', userId)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: subscription.status }),
    }
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message }) }
  }
}
