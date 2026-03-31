const Anthropic = require('@anthropic-ai/sdk')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }

  try {
    const { messages, tradingPlan, recentJournal, images, currentText } = JSON.parse(event.body)
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

    for (const m of (messages || []).slice(-20)) {
      if (m.content) claudeMessages.push({ role: m.role, content: m.content })
    }

    if (images?.length) {
      claudeMessages.push({
        role: 'user',
        content: [
          ...images.map(img => ({
            type: 'image',
            source: { type: 'base64', media_type: img.mimeType || 'image/jpeg', data: img.base64 },
          })),
          { type: 'text', text: currentText || 'Please analyze these charts.' },
        ],
      })
    } else if (currentText) {
      claudeMessages.push({ role: 'user', content: currentText })
    }

    if (!claudeMessages.length) return { statusCode: 400, body: JSON.stringify({ error: 'No message content' }) }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: claudeMessages,
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message.content[0].text }),
    }
  } catch (err) {
    console.error('chat error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
