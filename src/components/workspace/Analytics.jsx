import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const CYAN = '#22d3ee'
const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#94a3b8'
const TEXT_DIM = '#475569'
const GREEN = '#22c55e'
const RED = '#ef4444'

const SCORE_BANDS = [
  { min: 90, label: 'Elite', color: '#22c55e', desc: 'Executing at a high level. Protect this.' },
  { min: 75, label: 'Disciplined', color: '#22d3ee', desc: 'Solid. A few violations slipping through.' },
  { min: 60, label: 'Developing', color: '#f59e0b', desc: 'Room to improve. Review your rule violations.' },
  { min: 0,  label: 'Needs Work', color: '#ef4444', desc: 'Discipline is costing you real money.' },
]

function getBand(score) {
  return SCORE_BANDS.find(b => score >= b.min) || SCORE_BANDS[SCORE_BANDS.length - 1]
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Analytics() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [journal, setJournal] = useState([])
  const [pnl, setPnl] = useState([])
  const [range, setRange] = useState(30) // days to look back

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - range)
      const from = cutoff.toISOString().split('T')[0]

      const [{ data: j }, { data: p }] = await Promise.all([
        supabase.from('journal_entries').select('*').eq('user_id', user.id).gte('date', from).order('date'),
        supabase.from('pnl_entries').select('*').eq('user_id', user.id).gte('date', from).order('date'),
      ])
      setJournal(j || [])
      setPnl(p || [])
    } finally {
      setLoading(false)
    }
  }, [user, range])

  useEffect(() => { load() }, [load])

  // ── Derived metrics ───────────────────────────────────────
  const pnlByDate = {}
  pnl.forEach(e => { pnlByDate[e.date] = parseFloat(e.pnl) || 0 })

  const journalDays = journal.length
  const violationEntries = journal.filter(j => j.rule_violated)
  const violationDays = violationEntries.length
  const cleanDays = journalDays - violationDays
  const violationRate = journalDays > 0 ? violationDays / journalDays : 0

  // Dollar cost
  const violationPnls = violationEntries.map(j => pnlByDate[j.date] ?? 0)
  const cleanPnls = journal.filter(j => !j.rule_violated).map(j => pnlByDate[j.date] ?? 0)

  const avgViolationPnl = violationPnls.length > 0
    ? violationPnls.reduce((s, v) => s + v, 0) / violationPnls.length : null
  const avgCleanPnl = cleanPnls.length > 0
    ? cleanPnls.reduce((s, v) => s + v, 0) / cleanPnls.length : null

  // What would the violation days have made at clean average?
  const estimatedCost = (avgCleanPnl !== null && avgViolationPnl !== null && violationDays > 0)
    ? (avgCleanPnl - avgViolationPnl) * violationDays : null

  // Discipline score: 100 - (violation rate * 60) - (violations penalty)
  const score = journalDays === 0 ? null : Math.max(0, Math.round(
    100 - (violationRate * 60) - (violationDays * 3)
  ))
  const band = score !== null ? getBand(score) : null

  // Most broken rules
  const ruleCounts = {}
  violationEntries.forEach(j => {
    if (j.violated_rule) {
      const key = j.violated_rule.trim()
      ruleCounts[key] = (ruleCounts[key] || 0) + 1
    }
  })
  const topRules = Object.entries(ruleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // P&L by day of week
  const dayPnl = Array(7).fill(null).map(() => ({ sum: 0, count: 0, violations: 0 }))
  pnl.forEach(e => {
    const dow = new Date(e.date + 'T00:00:00').getDay()
    dayPnl[dow].sum += parseFloat(e.pnl) || 0
    dayPnl[dow].count++
  })
  violationEntries.forEach(j => {
    const dow = new Date(j.date + 'T00:00:00').getDay()
    dayPnl[dow].violations++
  })

  // Overall P&L
  const totalPnl = pnl.reduce((s, e) => s + (parseFloat(e.pnl) || 0), 0)
  const winDays = pnl.filter(e => parseFloat(e.pnl) > 0).length
  const winRate = pnl.length > 0 ? Math.round((winDays / pnl.length) * 100) : 0
  const avgRR = pnl.filter(e => e.rr).length > 0
    ? (pnl.filter(e => e.rr).reduce((s, e) => s + parseFloat(e.rr), 0) / pnl.filter(e => e.rr).length).toFixed(2)
    : null

  if (loading) {
    return (
      <div style={{ maxWidth: '820px', margin: '0 auto' }} className="fade-in">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[200, 160, 140, 120].map((h, i) => (
            <div key={i} className="shimmer" style={{ borderRadius: '14px', height: `${h}px` }} />
          ))}
        </div>
      </div>
    )
  }

  if (journalDays === 0 && pnl.length === 0) {
    return (
      <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center', padding: '80px 24px' }} className="fade-in">
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>📊</div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: TEXT_PRIMARY, marginBottom: '8px' }}>No data yet</div>
        <div style={{ fontSize: '14px', color: TEXT_MUTED }}>Start logging your trades and journal entries — your analytics will appear here.</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }} className="fade-in">
      {/* Header + range */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: TEXT_PRIMARY, letterSpacing: '-0.4px' }}>Analytics</div>
          <div style={{ fontSize: '13px', color: TEXT_DIM, marginTop: '2px' }}>Your performance breakdown</div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              style={{
                background: range === d ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${range === d ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: range === d ? CYAN : TEXT_MUTED,
                padding: '5px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >{d}D</button>
          ))}
        </div>
      </div>

      {/* ── Top row: Score + Cost ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

        {/* Discipline Score */}
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: `1px solid ${band ? band.color + '33' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '16px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: '120px', height: '120px',
            background: `radial-gradient(circle at top right, ${band?.color || CYAN}18, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div style={{ fontSize: '11px', fontWeight: '700', color: TEXT_DIM, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Discipline Score
          </div>
          {score !== null ? (
            <>
              <div style={{ fontSize: '56px', fontWeight: '800', color: band.color, lineHeight: 1, letterSpacing: '-2px', marginBottom: '6px' }}>
                {score}
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: band.color + '18',
                border: `1px solid ${band.color}44`,
                borderRadius: '20px',
                padding: '3px 10px',
                marginBottom: '10px',
              }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: band.color }}>{band.label}</span>
              </div>
              <div style={{ fontSize: '12px', color: TEXT_DIM, lineHeight: 1.4 }}>{band.desc}</div>
              <div style={{ marginTop: '14px', display: 'flex', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: TEXT_DIM, fontWeight: '600' }}>CLEAN DAYS</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: GREEN }}>{cleanDays}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: TEXT_DIM, fontWeight: '600' }}>VIOLATIONS</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: RED }}>{violationDays}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: TEXT_DIM, fontWeight: '600' }}>VIOLATION RATE</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: TEXT_MUTED }}>{Math.round(violationRate * 100)}%</div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ fontSize: '14px', color: TEXT_DIM }}>Log journal entries with the rule violated field to see your score</div>
          )}
        </div>

        {/* Cost of Indiscipline */}
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: TEXT_DIM, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Cost of Indiscipline
          </div>
          {estimatedCost !== null ? (
            <>
              <div style={{ fontSize: '13px', color: TEXT_MUTED, marginBottom: '6px' }}>Rule violations cost you an estimated</div>
              <div style={{
                fontSize: '40px',
                fontWeight: '800',
                color: estimatedCost > 0 ? RED : GREEN,
                letterSpacing: '-1px',
                lineHeight: 1,
                marginBottom: '8px',
              }}>
                {estimatedCost > 0 ? '-' : '+'}${Math.abs(estimatedCost).toFixed(0)}
              </div>
              <div style={{ fontSize: '11px', color: TEXT_DIM, marginBottom: '16px' }}>
                vs. trading at your clean-day average
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <CompRow label="Avg P&L — clean days" value={avgCleanPnl} />
                <CompRow label="Avg P&L — violation days" value={avgViolationPnl} />
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '13px', color: TEXT_DIM }}>
                Log P&L entries alongside your journal to see the dollar cost of rule violations.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <StatRow label="Total P&L" value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`} color={totalPnl >= 0 ? GREEN : RED} />
                <StatRow label="Win Rate" value={`${winRate}%`} color={winRate >= 50 ? GREEN : RED} />
                {avgRR && <StatRow label="Avg R:R" value={avgRR} color={CYAN} />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Overall P&L row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '16px',
      }}>
        {[
          { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? GREEN : RED },
          { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 50 ? GREEN : RED },
          { label: 'Trading Days', value: pnl.length, color: TEXT_PRIMARY },
          { label: 'Avg R:R', value: avgRR ? avgRR + 'R' : '—', color: CYAN },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: TEXT_DIM, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color, letterSpacing: '-0.5px' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Top violated rules */}
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: TEXT_DIM, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Most Broken Rules
          </div>
          {topRules.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topRules.map(([rule, count], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: i === 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${i === 0 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', fontWeight: '700',
                    color: i === 0 ? RED : TEXT_DIM,
                    flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: TEXT_PRIMARY, fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rule}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '11px', fontWeight: '700',
                    color: RED,
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    flexShrink: 0,
                  }}>{count}×</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: TEXT_DIM, fontStyle: 'italic' }}>
              {violationDays === 0 ? 'No rule violations logged 🏆' : 'Add violated rule details in your journal entries'}
            </div>
          )}
        </div>

        {/* Day of week breakdown */}
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: TEXT_DIM, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '14px' }}>
            P&L by Day
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DAYS.slice(1, 6).map((day, i) => {
              const realIdx = i + 1
              const d = dayPnl[realIdx]
              const avg = d.count > 0 ? d.sum / d.count : 0
              const maxAbs = Math.max(...DAYS.slice(1, 6).map((_, ii) => Math.abs(dayPnl[ii + 1].count > 0 ? dayPnl[ii + 1].sum / dayPnl[ii + 1].count : 0)), 1)
              const barW = Math.abs(avg) / maxAbs * 100
              return (
                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', fontSize: '11px', fontWeight: '600', color: TEXT_DIM, flexShrink: 0 }}>{day}</div>
                  <div style={{ flex: 1, height: '20px', position: 'relative', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute',
                      top: 0, bottom: 0, left: 0,
                      width: d.count > 0 ? `${barW}%` : '0%',
                      background: avg >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <div style={{ width: '60px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: avg >= 0 ? GREEN : RED, flexShrink: 0 }}>
                    {d.count > 0 ? `${avg >= 0 ? '+' : ''}$${avg.toFixed(0)}` : '—'}
                  </div>
                  {d.violations > 0 && (
                    <div style={{ fontSize: '10px', color: RED, flexShrink: 0, background: 'rgba(239,68,68,0.08)', borderRadius: '4px', padding: '1px 5px' }}>
                      {d.violations}✗
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Shareable Insight Card ── */}
      {(score !== null || totalPnl !== 0) && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(34,211,238,0.06) 0%, rgba(129,140,248,0.06) 100%)',
          border: '1px solid rgba(34,211,238,0.2)',
          borderRadius: '16px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(34,211,238,0.05) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', position: 'relative' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(34,211,238,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                MaxTradeAI · Insight Card
              </div>
              <div style={{ fontSize: '13px', color: TEXT_DIM }}>Last {range} days</div>
            </div>
            <div style={{ fontSize: '11px', color: TEXT_DIM, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '4px 10px' }}>
              📸 Screenshot to share
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', position: 'relative' }}>
            {score !== null && (
              <InsightStat
                label="Discipline Score"
                value={score}
                suffix="/100"
                color={band.color}
                sub={band.label}
              />
            )}
            <InsightStat
              label="Total P&L"
              value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}`}
              color={totalPnl >= 0 ? GREEN : RED}
              sub={`${pnl.length} trading days`}
            />
            <InsightStat
              label="Win Rate"
              value={`${winRate}%`}
              color={winRate >= 50 ? GREEN : RED}
              sub={`${winDays}W / ${pnl.length - winDays}L`}
            />
          </div>

          {estimatedCost !== null && estimatedCost > 50 && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '10px',
              fontSize: '13px',
              color: '#fca5a5',
              position: 'relative',
            }}>
              ⚠️ Rule violations cost an estimated <strong>${estimatedCost.toFixed(0)}</strong> vs. trading your clean-day average
            </div>
          )}

          <div style={{ marginTop: '14px', fontSize: '11px', color: 'rgba(34,211,238,0.4)', position: 'relative', textAlign: 'right' }}>
            maxtradeai.com
          </div>
        </div>
      )}
    </div>
  )
}

function CompRow({ label, value }) {
  if (value === null) return null
  const color = value >= 0 ? GREEN : RED
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
      <span style={{ fontSize: '12px', color: TEXT_MUTED }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: '700', color }}>{value >= 0 ? '+' : ''}${value.toFixed(2)}</span>
    </div>
  )
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', color: TEXT_MUTED }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: '700', color }}>{value}</span>
    </div>
  )
}

function InsightStat({ label, value, suffix = '', color, sub }) {
  return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: '700', color: TEXT_DIM, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '800', color, letterSpacing: '-0.5px', lineHeight: 1 }}>
        {value}<span style={{ fontSize: '14px', fontWeight: '600', opacity: 0.7 }}>{suffix}</span>
      </div>
      {sub && <div style={{ fontSize: '11px', color: TEXT_DIM, marginTop: '3px' }}>{sub}</div>}
    </div>
  )
}
