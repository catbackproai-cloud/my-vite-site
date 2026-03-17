const Stripe = require('stripe')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const { email } = JSON.parse(event.body)
    const baseUrl = event.headers.origin || 'http://localhost:8888'

    const customers = await stripe.customers.list({ email, limit: 1 })
    if (!customers.data.length) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Customer not found' }),
      }
    }

    const session = await stripe.billing_portal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${baseUrl}/workspace`,
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    }
  } catch (err) {
    console.error('create-portal error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
