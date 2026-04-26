import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useStreak } from '../../hooks/useStreak'

const C    = '#22d3ee'
const T1   = '#f1f5f9'
const T2   = '#94a3b8'
const T3   = '#475569'
const GREEN = '#22c55e'
const RED   = '#ef4444'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function greet() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── Mini equity sparkline ────────────────────────────────────
function Sparkline({ data, color = C, height = 36 }) {
  if (!data || data.length < 2) return null
  const w = 120
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={height} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ── KPI card ─────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = T1, sparkData, prefix = '', loading }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '14px',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.2s ease',
    }}
      className="card-hover-cyan"
    >
      <div style={{ fontSize: '10px', fontWeight: '700', color: T3, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '10px' }}>{label}</div>
      {loading ? (
        <div className="shimmer" style={{ height: '32px', width: '80px', borderRadius: '6px' }} />
      ) : (
        <div style={{ fontSize: '28px', fontWeight: '800', color, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '-1px', lineHeight: 1, marginBottom: '6px' }}>
          {prefix}{value}
        </div>
      )}
      {sub && <div style={{ fontSize: '11px', color: T3, marginTop: '4px' }}>{sub}</div>}
      {sparkData && (
        <div style={{ position: 'absolute', bottom: '10px', right: '12px', opacity: 0.5 }}>
          <Sparkline data={sparkData} color={color} />
        </div>
      )}
    </div>
  )
}

// ── Quick action button ──────────────────────────────────────
function QuickAction({ icon, label, desc, onClick, accent = C }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        fontFamily: 'inherit',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = accent + '44'
        e.currentTarget.style.background = accent + '08'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
        e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{
        width: '38px', height: '38px', borderRadius: '10px',
        background: accent + '12',
        border: `1px solid ${accent}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: T1, marginBottom: '2px', letterSpacing: '-0.01em' }}>{label}</div>
        <div style={{ fontSize: '11.5px', color: T3 }}>{desc}</div>
      </div>
      <div style={{ marginLeft: 'auto', color: T3, fontSize: '14px' }}>→</div>
    </button>
  )
}

// ── Main ─────────────────────────────────────────────────────
export default function Dashboard({ setActivePage }) {
  const { user, profile } = useAuth()
  const streak = useStreak(user?.id)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalPnl: 0, winRate: 0, tradingDays: 0, disciplineScore: null, sparkline: [] })
  const [todayPnl, setTodayPnl] = useState(null)
  const [recap, setRecap] = useState(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      const from = cutoff.toISOString().split('T')[0]
      const today = todayStr()

      const [{ data: pnl }, { data: journal }, { data: recapData }] = await Promise.all([
        supabase.from('pnl_entries').select('date,pnl').eq('user_id', user.id).gte('date', from).order('date'),
        supabase.from('journal_entries').select('date,rule_violated').eq('user_id', user.id).gte('date', from),
        supabase.from('weekly_recaps').select('recap,week_of').eq('user_id', user.id).order('week_of', { ascending: false }).limit(1).single(),
      ])

      // KPIs
      const entries = pnl || []
      const totalPnl = entries.reduce((s, e) => s + (parseFloat(e.pnl) || 0), 0)
      const winDays = entries.filter(e => parseFloat(e.pnl) > 0).length
      const winRate = entries.length > 0 ? Math.round((winDays / entries.length) * 100) : 0

      // Sparkline: running cumulative P&L
      let running = 0
      const sparkline = entries.map(e => { running += parseFloat(e.pnl) || 0; return running })

      // Discipline score
      const journalEntries = journal || []
      const violations = journalEntries.filter(j => j.rule_violated).length
      const score = journalEntries.length > 0
        ? Math.max(0, Math.round(100 - (violations / journalEntries.length) * 60 - violations * 3))
        : null

      // Today's P&L
      const todayEntry = entries.find(e => e.date === today)
      setTodayPnl(todayEntry ? parseFloat(todayEntry.pnl) : null)

      setStats({ totalPnl, winRate, tradingDays: entries.length, disciplineScore: score, sparkline })
      if (recapData) setRecap(recapData.recap)
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const firstName = profile?.full_name?.split(' ')[0] || 'Trader'
  const { totalPnl, winRate, tradingDays, disciplineScore, sparkline } = stats

  const scoreColor = disciplineScore === null ? T2
    : disciplineScore >= 90 ? GREEN
    : disciplineScore >= 75 ? C
    : disciplineScore >= 60 ? '#f59e0b'
    : RED

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }} className="fade-in">

      {/* ── Greeting ── */}
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: T1, letterSpacing: '-0.5px', marginBottom: '4px' }}>
            {greet()}, {firstName} 👋
          </div>
          <div style={{ fontSize: '13px', color: T3 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {todayPnl !== null && (
              <span style={{
                marginLeft: '10px',
                fontFamily: 'IBM Plex Mono, monospace',
                fontWeight: '600',
                color: todayPnl >= 0 ? GREEN : RED,
              }}>
                · Today: {todayPnl >= 0 ? '+' : ''}${todayPnl.toFixed(0)}
              </span>
            )}
          </div>
        </div>
        {streak > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            padding: '6px 14px', borderRadius: '20px',
          }} className="streak-badge">
            <span style={{ fontSize: '16px' }}>🔥</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#fbbf24', fontFamily: 'IBM Plex Mono, monospace' }}>
              {streak} day streak
            </span>
          </div>
        )}
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <KpiCard
          label="30-Day P&L"
          value={`${totalPnl >= 0 ? '+' : ''}$${Math.abs(totalPnl).toFixed(0)}`}
          color={totalPnl >= 0 ? GREEN : RED}
          sub={`${tradingDays} trading days`}
          sparkData={sparkline}
          loading={loading}
        />
        <KpiCard
          label="Win Rate"
          value={`${winRate}%`}
          color={winRate >= 55 ? GREEN : winRate >= 45 ? C : RED}
          sub={`Last 30 days`}
          loading={loading}
        />
        <KpiCard
          label="Discipline Score"
          value={disciplineScore !== null ? disciplineScore : '—'}
          color={scoreColor}
          sub={disciplineScore !== null
            ? disciplineScore >= 90 ? 'Elite 🏆' : disciplineScore >= 75 ? 'Disciplined' : disciplineScore >= 60 ? 'Developing' : 'Needs work'
            : 'Log journal to track'}
          loading={loading}
        />
        <KpiCard
          label="Journal Streak"
          value={streak > 0 ? `🔥 ${streak}` : '—'}
          color='#fbbf24'
          sub={streak > 0 ? `${streak} consecutive days` : 'Start your streak'}
          loading={loading}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>

        {/* ── Quick actions ── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '14px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: T3, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Quick Actions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <QuickAction
              icon="🎯"
              label="Today's Plan"
              desc="Set your bias and session intent"
              onClick={() => setActivePage('plan')}
              accent='#f59e0b'
            />
            <QuickAction
              icon="🧠"
              label="Talk to Your Coach"
              desc="Debrief a trade or ask anything"
              onClick={() => setActivePage('ai')}
              accent={C}
            />
            <QuickAction
              icon="📓"
              label="Journal Today"
              desc="Log what you learned and what to fix"
              onClick={() => setActivePage('journal')}
              accent='#818cf8'
            />
          </div>
        </div>

        {/* ── Weekly recap / getting started ── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: T3, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '14px' }}>
            {recap ? 'Latest AI Recap' : 'Get Started'}
          </div>

          {recap ? (
            <>
              <div style={{
                flex: 1,
                fontSize: '13px',
                color: T2,
                lineHeight: '1.7',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 7,
                WebkitBoxOrient: 'vertical',
              }}>
                {recap}
              </div>
              <button
                onClick={() => setActivePage('ai')}
                style={{
                  marginTop: '14px',
                  background: 'rgba(34,211,238,0.08)',
                  border: '1px solid rgba(34,211,238,0.2)',
                  color: C,
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,211,238,0.08)'}
              >
                Continue with coach →
              </button>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { step: '1', text: 'Set your trading plan in the AI Coach', page: 'ai' },
                { step: '2', text: 'Define your confluences in Daily Plan', page: 'plan' },
                { step: '3', text: 'Log your first journal entry', page: 'journal' },
                { step: '4', text: 'Log P&L on your calendar', page: 'pnl' },
              ].map(s => (
                <button
                  key={s.step}
                  onClick={() => setActivePage(s.page)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', padding: 0,
                  }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: '700', color: C, flexShrink: 0,
                  }}>{s.step}</div>
                  <span style={{ fontSize: '13px', color: T2 }}
                    onMouseEnter={e => e.currentTarget.style.color = T1}
                    onMouseLeave={e => e.currentTarget.style.color = T2}
                  >{s.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Today's reminder ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(34,211,238,0.05), rgba(99,102,241,0.05))',
        border: '1px solid rgba(34,211,238,0.12)',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}>
        <div style={{ fontSize: '20px' }}>💡</div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: C, marginBottom: '2px' }}>Coaching reminder</div>
          <div style={{ fontSize: '13px', color: T2, lineHeight: 1.5 }}>
            Set your daily plan before the market opens. Traders who plan before sessions make{' '}
            <span style={{ color: T1, fontWeight: '500' }}>fewer impulse trades</span> and have better rule adherence.
          </div>
        </div>
        <button
          onClick={() => setActivePage('plan')}
          style={{
            marginLeft: 'auto', flexShrink: 0,
            background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)',
            color: C, borderRadius: '7px', padding: '7px 14px',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,211,238,0.1)'}
        >
          Open Plan →
        </button>
      </div>

    </div>
  )
}
