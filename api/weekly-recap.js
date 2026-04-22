import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { userId, tradingPlan } = req.body
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
        content: `You are MaxTradeAI — an elite AI coach for ICT and Smart Money Concepts traders. Generate a weekly performance recap using ICT language and framework.

${tradingPlan ? `TRADER'S RULES & PLAN:\n${tradingPlan}\n` : ''}
WEEK NUMBERS:
- Total P&L: $${totalPnl.toFixed(2)}
- Win days: ${winDays}, Loss days: ${lossDays}, Trades logged: ${(pnlEntries || []).length}

TRADE LOG:
${tradeSummary || 'No trades logged this week'}

JOURNAL ENTRIES:
${journalSummary || 'No journal entries this week'}

Write a sharp weekly recap. Lead with a one-sentence verdict on their week. Then: what they executed well (be specific — reference actual entries, sessions, or setups from the data). Then: the biggest pattern or mistake — name it in ICT terms if applicable (front-running, trading dead zone, no liquidity sweep, HTF misalignment, revenge trade, etc.). End with one focused thing to work on next week. Max 200 words. No headers. Write like a coach who trades ICT talking directly to them.`,
      }],
    })

    const recap = message.content[0].text

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
