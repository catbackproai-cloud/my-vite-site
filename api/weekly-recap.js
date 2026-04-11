const Anthropic = require('@anthropic-ai/sdk')
const { createClient } = require('@supabase/supabase-js')

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { userId, tradingPlan } = req.body
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const fromDate = sevenDaysAgo.toISOString().split('T')[0]

    const [{ data: journalEntries }, { data: pnlEntries }] = await Promise.all([
      supabase.from('journal_entries').select('*').eq('user_id', userId).gte('date', fromDate).order('date'),
      supabase.from('pnl_entries').select('*').eq('user_id', userId).gte('date', fromDate).order('date'),
    ])

    const totalPnl = (pnlEntries || []).reduce((sum, e) => sum + (parseFloat(e.pnl) || 0), 0)
    const winDays = (pnlEntries || []).filter(e => parseFloat(e.pnl) > 0).length
    const lossDays = (pnlEntries || []).filter(e => parseFloat(e.pnl) < 0).length

    const journalSummary = (journalEntries || []).map(e =>
      `${e.date}:\n  Notes: ${e.notes || '-'}\n  Learned: ${e.learned || '-'}\n  Improve: ${e.improve || '-'}`
    ).join('\n\n')

    const tradeSummary = (pnlEntries || []).map(e =>
      `${e.date}: ${e.symbol || 'Trade'} | P&L: $${e.pnl} | R:R: ${e.rr || '-'}`
    ).join('\n')

    const prompt = `You are MaxTradeAI, a personal AI trading coach. Generate a weekly performance recap for this trader.

${tradingPlan ? `TRADER'S RULES:\n${tradingPlan}\n` : ''}
WEEK SUMMARY (last 7 days):
- Total P&L: $${totalPnl.toFixed(2)}
- Win days: ${winDays}, Loss days: ${lossDays}
- Trades logged: ${(pnlEntries || []).length}

TRADE LOG:
${tradeSummary || 'No trades logged this week'}

JOURNAL ENTRIES:
${journalSummary || 'No journal entries this week'}

Write a concise weekly recap. Include:
1. A one-sentence overall performance verdict
2. What they did well this week (be specific, reference actual entries)
3. The biggest pattern or mistake you noticed
4. One focused thing to work on next week

Be direct and honest. Max 200 words. Don't use headers — write it like a coach talking to them.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    res.status(200).json({ recap: message.content[0].text })
  } catch (err) {
    console.error('weekly-recap error:', err)
    res.status(500).json({ error: err.message })
  }
}
