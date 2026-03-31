import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function jsonRes(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url?.startsWith('/api/')) return next()

            const origin = `http://${req.headers.host}`
            let body = {}
            if (req.method === 'POST') {
              try {
                body = JSON.parse(await readBody(req))
              } catch {
                return jsonRes(res, 400, { error: 'Invalid JSON' })
              }
            }

            try {
              // ── analyze-trade ──────────────────────────────────────────
              if (req.url === '/api/analyze-trade') {
                const { default: Anthropic } = await import('@anthropic-ai/sdk')
                const { imageBase64, mimeType, instrument, timeframe, strategyNotes } = body

                const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

                const systemPrompt = `You are MaxTradeAI, an expert trading coach and technical analyst. You analyze trading charts and provide concise, actionable feedback. You grade trades A-F based on setup quality, risk management, and execution. Be direct and specific. Format your response as:

GRADE: [A/B/C/D/F]

ANALYSIS:
[2-3 sentences on what you see in the chart]

STRENGTHS:
- [bullet point]
- [bullet point]

IMPROVEMENTS:
- [bullet point]
- [bullet point]

COACHING TIP:
[One actionable tip]`

                const message = await client.messages.create({
                  model: 'claude-sonnet-4-6',
                  max_tokens: 1024,
                  system: systemPrompt,
                  messages: [
                    {
                      role: 'user',
                      content: [
                        {
                          type: 'image',
                          source: {
                            type: 'base64',
                            media_type: mimeType || 'image/jpeg',
                            data: imageBase64,
                          },
                        },
                        {
                          type: 'text',
                          text: `Instrument: ${instrument}\nTimeframe: ${timeframe}\n\nTrader's notes: ${strategyNotes || 'None provided'}\n\nPlease analyze this chart and provide coaching feedback.`,
                        },
                      ],
                    },
                  ],
                })

                const text = message.content[0].text
                const gradeMatch = text.match(/GRADE:\s*([A-F])/)
                const grade = gradeMatch ? gradeMatch[1] : 'C'
                return jsonRes(res, 200, { feedback: text, grade })
              }

              // ── chat ──────────────────────────────────────────────────
              if (req.url === '/api/chat') {
                const { default: Anthropic } = await import('@anthropic-ai/sdk')
                const { messages, tradingPlan, recentJournal, imageBase64, mimeType, currentText } = body

                const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

                const journalContext = recentJournal?.length
                  ? `\nRECENT JOURNAL ENTRIES (last 14 days):\n${recentJournal.map(e => `${e.date}: Notes: ${e.notes || '-'} | Learned: ${e.learned || '-'} | Improve: ${e.improve || '-'}`).join('\n')}`
                  : ''

                const systemPrompt = `You are MaxTradeAI, a personal AI trading coach. You help traders improve by learning their style, holding them accountable to their plan, and analyzing their chart setups.

${tradingPlan ? `TRADER'S TRADING PLAN & RULES:\n${tradingPlan}` : 'The trader has not yet set a trading plan. Encourage them to add one so you can better coach them.'}
${journalContext}
Your coaching style:
- Be direct and honest — praise good execution, call out rule violations by name
- When you see a chart, grade it A-F and explain why based on their specific rules
- Reference their plan rules when relevant ("This breaks your rule about...")
- Notice patterns from their journal entries and call them out
- Be concise but actionable — no fluff
- You accept text questions, trade descriptions, and chart screenshot images`

                const claudeMessages = []

                // Add conversation history (text only)
                for (const m of (messages || []).slice(-20)) {
                  if (m.content) {
                    claudeMessages.push({ role: m.role, content: m.content })
                  }
                }

                // Build current user message (may include image)
                if (imageBase64) {
                  claudeMessages.push({
                    role: 'user',
                    content: [
                      {
                        type: 'image',
                        source: { type: 'base64', media_type: mimeType || 'image/jpeg', data: imageBase64 },
                      },
                      { type: 'text', text: currentText || 'Please analyze this chart.' },
                    ],
                  })
                } else if (currentText) {
                  claudeMessages.push({ role: 'user', content: currentText })
                }

                if (!claudeMessages.length) {
                  return jsonRes(res, 400, { error: 'No message content' })
                }

                const message = await client.messages.create({
                  model: 'claude-sonnet-4-6',
                  max_tokens: 2048,
                  system: systemPrompt,
                  messages: claudeMessages,
                })

                return jsonRes(res, 200, { content: message.content[0].text })
              }

              // ── verify-checkout ───────────────────────────────────────
              if (req.url === '/api/verify-checkout') {
                const { default: Stripe } = await import('stripe')
                const { createClient } = await import('@supabase/supabase-js')
                const { sessionId, userId } = body

                const stripe = new Stripe(env.STRIPE_SECRET_KEY)
                const supabaseAdmin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

                const session = await stripe.checkout.sessions.retrieve(sessionId)
                if (session.payment_status !== 'paid') {
                  return jsonRes(res, 400, { error: 'Payment not completed' })
                }

                const subscription = await stripe.subscriptions.retrieve(session.subscription)
                await supabaseAdmin.from('profiles').update({
                  subscription_status: subscription.status,
                  subscription_id: subscription.id,
                  stripe_customer_id: session.customer,
                  current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                }).eq('id', userId)

                return jsonRes(res, 200, { status: subscription.status })
              }

              // ── create-checkout ────────────────────────────────────────
              if (req.url === '/api/create-checkout') {
                const { default: Stripe } = await import('stripe')
                const stripe = new Stripe(env.STRIPE_SECRET_KEY)
                const { email, userId, priceId } = body

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
                  success_url: `${origin}/workspace?session_id={CHECKOUT_SESSION_ID}`,
                  cancel_url: `${origin}/upgrade`,
                  metadata: { userId },
                })

                return jsonRes(res, 200, { url: session.url })
              }

              // ── create-portal ──────────────────────────────────────────
              if (req.url === '/api/create-portal') {
                const { default: Stripe } = await import('stripe')
                const stripe = new Stripe(env.STRIPE_SECRET_KEY)
                const { email } = body

                const customers = await stripe.customers.list({ email, limit: 1 })
                if (!customers.data.length) {
                  return jsonRes(res, 404, { error: 'Customer not found' })
                }

                const session = await stripe.billing_portal.sessions.create({
                  customer: customers.data[0].id,
                  return_url: `${origin}/workspace`,
                })

                return jsonRes(res, 200, { url: session.url })
              }

              next()
            } catch (err) {
              console.error(`[api] ${req.url} error:`, err.message)
              jsonRes(res, 500, { error: err.message })
            }
          })
        },
      },
    ],
    base: '/',
  }
})
