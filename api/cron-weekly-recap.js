import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const now = new Date()
  const weekOf = now.toISOString().split('T')[0]

  const { data: users } = await supabase
    .from('profiles')
    .select('id, trading_plan')
    .eq('subscription_status', 'active')

  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const fromDate = sevenDaysAgo.toISOString().split('T')[0]

  let generated = 0

  for (const user of (users || [])) {
    const { data: existing } = await supabase
      .from('weekly_recaps')
      .select('id')
      .eq('user_id', user.id)
      .eq('week_of', weekOf)
      .single()

    if (existing) continue

    const [{ data: journalEntries }, { data: pnlEntries }] = await Promise.all([
      supabase.from('journal_entries').select('*').eq('user_id', user.id).gte('date', fromDate).order('date'),
      supabase.from('pnl_entries').select('*').eq('user_id', user.id).gte('date', fromDate).order('date'),
    ])

    if (!journalEntries?.length && !pnlEntries?.length) continue

    try {
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
          content: `You are MaxTradeAI. Generate a weekly trading recap.\n${user.trading_plan ? `Rules:\n${user.trading_plan}\n` : ''}P&L: $${totalPnl.toFixed(2)}, Wins: ${winDays}, Losses: ${lossDays}\nTrades:\n${tradeSummary || 'None'}\nJournal:\n${journalSummary || 'None'}\n\nOne-sentence verdict, what they did well, biggest mistake, one focus for next week. Max 200 words. No headers.`,
        }],
      })

      await supabase.from('weekly_recaps').insert({
        user_id: user.id,
        week_of: weekOf,
        recap: message.content[0].text,
      })
      generated++
    } catch {
      // continue to next user
    }
  }

  res.status(200).json({ ok: true, generated })
}
