const Anthropic = require('@anthropic-ai/sdk')
const { createClient } = require('@supabase/supabase-js')

// Runs every Saturday at 9am UTC via Vercel Cron
module.exports = async (req, res) => {
  // Verify it's a cron request
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Get the Saturday date for this week's recap
  const now = new Date()
  const weekOf = now.toISOString().split('T')[0]

  // Get all users with active subscriptions
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, trading_plan')
    .eq('subscription_status', 'active')

  if (usersError) return res.status(500).json({ error: usersError.message })

  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const fromDate = sevenDaysAgo.toISOString().split('T')[0]

  let generated = 0

  for (const user of (users || [])) {
    // Skip if recap already exists for this week
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

    const recap = await generateRecap(client, user.trading_plan, journalEntries, pnlEntries)
    if (!recap) continue

    await supabase.from('weekly_recaps').insert({ user_id: user.id, week_of: weekOf, recap })
    generated++
  }

  res.status(200).json({ ok: true, generated })
}

async function generateRecap(client, tradingPlan, journalEntries, pnlEntries) {
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
        content: `You are MaxTradeAI, a personal AI trading coach. Generate a weekly performance recap.

${tradingPlan ? `TRADER'S RULES:\n${tradingPlan}\n` : ''}
WEEK SUMMARY:
- Total P&L: $${totalPnl.toFixed(2)}
- Win days: ${winDays}, Loss days: ${lossDays}, Trades: ${(pnlEntries || []).length}

TRADE LOG:
${tradeSummary || 'No trades logged'}

JOURNAL:
${journalSummary || 'No journal entries'}

Write a concise weekly recap: one-sentence verdict, what they did well, biggest pattern or mistake, one thing to focus on next week. Be direct. Max 200 words. No headers — write like a coach talking to them.`,
      }],
    })

    return message.content[0].text
  } catch {
    return null
  }
}
