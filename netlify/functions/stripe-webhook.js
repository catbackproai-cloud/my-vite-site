const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const sig = event.headers['stripe-signature']
  let stripeEvent

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  try {
    const subscription = stripeEvent.data.object

    if (['customer.subscription.created', 'customer.subscription.updated'].includes(stripeEvent.type)) {
      const customer = await stripe.customers.retrieve(subscription.customer)
      const userId = customer.metadata?.userId || subscription.metadata?.userId

      if (userId) {
        await supabase.from('profiles').upsert({
          id: userId,
          stripe_customer_id: subscription.customer,
          subscription_status: subscription.status,
          subscription_id: subscription.id,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
      }
    }

    if (stripeEvent.type === 'customer.subscription.deleted') {
      const customer = await stripe.customers.retrieve(subscription.customer)
      const userId = customer.metadata?.userId

      if (userId) {
        await supabase.from('profiles').update({
          subscription_status: 'canceled',
          updated_at: new Date().toISOString(),
        }).eq('id', userId)
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received: true }),
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
