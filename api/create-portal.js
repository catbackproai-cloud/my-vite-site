import Stripe from 'stripe'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const { email } = req.body
    const baseUrl = req.headers.origin || 'https://maxtradeai.com'

    const customers = await stripe.customers.list({ email, limit: 1 })
    if (!customers.data.length) return res.status(404).json({ error: 'Customer not found' })

    const session = await stripe.billing_portal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${baseUrl}/workspace`,
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('create-portal error:', err)
    res.status(500).json({ error: err.message })
  }
}
