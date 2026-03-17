const Anthropic = require('@anthropic-ai/sdk')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const { imageBase64, mimeType, instrument, timeframe, strategyNotes } = JSON.parse(event.body)

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

    const userContent = [
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
    ]

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })

    const text = message.content[0].text

    // Parse grade from response
    const gradeMatch = text.match(/GRADE:\s*([A-F])/)
    const grade = gradeMatch ? gradeMatch[1] : 'C'

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: text, grade }),
    }
  } catch (err) {
    console.error('analyze-trade error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
