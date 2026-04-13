const Anthropic = require('@anthropic-ai/sdk')
const { createClient } = require('@supabase/supabase-js')

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { userId, tradingPlan } = req.body
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Return the most recent stored recap if one exists
    const { data: latest } = await supabase
      .from('weekly_recaps')
      .select('recap, week_of')
      .eq('user_id', userId)
      .order('week_of', { ascending: false })
      .limit(1)
      .single()

    if (latest) {
      return res.status(200).json({ recap: latest.recap, week_of: latest.week_of, cached: true })
    }

    // No recap stored yet — generate one now
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const fromDate = sevenDaysAgo.toISOString().split('T')[0]
    const weekOf = new Date().toISOString().split('T')[0]

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

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `You are MaxTradeAI, a personal AI trading coach. Generate a weekly performance recap.

${tradingPlan ? `TRADER'S RULES:\n${tradingPlan}\n` : ''}
WEEK SUMMARY:
- Total P&L: $${totalPnl.toFixed(2)}
- Win days: ${winDays}, Loss days: ${lossDays}, Trades: ${(pnlEntries || []).length}

TRADE LOG:
${tradeSummary || 'No trades logged this week'}

JOURNAL:
${journalSummary || 'No journal entries this week'}

Write a concise weekly recap: one-sentence verdict, what they did well, biggest pattern or mistake, one thing to focus on next week. Be direct. Max 200 words. No headers — write like a coach talking to them.`,
      }],
    })

    const recap = message.content[0].text

    // Store it so future clicks are instant
    await supabase.from('weekly_recaps').upsert(
      { user_id: userId, week_of: weekOf, recap },
      { onConflict: 'user_id,week_of' }
    )

    res.status(200).json({ recap, week_of: weekOf, cached: false })
  } catch (err) {
    console.error('weekly-recap error:', err)
    res.status(500).json({ error: err.message })
  }
}
