import { useAuth } from '../../context/AuthContext'
import { useStreak } from '../../hooks/useStreak'

const T1 = '#f1f5f9'
const T2 = '#94a3b8'
const T3 = '#475569'
const C  = '#22d3ee'

const PAGE_META = {
  dashboard: { title: 'Dashboard',      sub: 'Your trading overview' },
  ai:        { title: 'AI Coach',        sub: 'Chat with your personal trading coach' },
  plan:      { title: 'Daily Plan',      sub: 'Pre-session bias and setup criteria' },
  pnl:       { title: 'P&L Calendar',   sub: 'Track your daily performance' },
  journal:   { title: 'Journal',         sub: 'Reflect, review, improve' },
  analytics: { title: 'Analytics',       sub: 'Discipline score and performance breakdown' },
}

export default function Header({ activePage }) {
  const { user } = useAuth()
  const streak = useStreak(user?.id)
  const meta = PAGE_META[activePage] || { title: 'Workspace', sub: '' }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <header style={{
      background: '#07101f',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      padding: '0 24px',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      {/* Page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: T1, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {meta.title}
          </div>
          {meta.sub && (
            <div style={{ fontSize: '11px', color: T3, marginTop: '2px', letterSpacing: '-0.01em' }}>
              {meta.sub}
            </div>
          )}
        </div>
      </div>

      {/* Right pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {streak > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            padding: '4px 10px',
            borderRadius: '6px',
          }}>
            <span style={{ fontSize: '12px' }}>🔥</span>
            <span style={{ fontSize: '11.5px', color: '#fbbf24', fontWeight: '600', fontFamily: 'IBM Plex Mono, monospace' }}>
              {streak}d streak
            </span>
          </div>
        )}
        <div style={{
          fontSize: '11.5px',
          color: T3,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '4px 10px',
          borderRadius: '6px',
          fontFamily: 'IBM Plex Mono, monospace',
        }}>
          {today}
        </div>
      </div>
    </header>
  )
}
