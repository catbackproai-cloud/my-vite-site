import Stripe from 'stripe'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const { email, userId, priceId } = req.body
    const baseUrl = req.headers.origin || 'https://maxtradeai.com'

    let customerId
    const existing = await stripe.customers.list({ email, limit: 1 })
    if (existing.data.length > 0) {
      customerId = existing.data[0].id
    } else {
      const customer = await stripe.customers.create({ email, metadata: { userId } })
      customerId = customer.id
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${baseUrl}/workspace?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/upgrade`,
      metadata: { userId },
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('create-checkout error:', err)
    res.status(500).json({ error: err.message })
  }
}
