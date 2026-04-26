import { useAuth } from '../../context/AuthContext'

const C    = '#22d3ee'
const T1   = '#f1f5f9'
const T2   = '#94a3b8'
const T3   = '#475569'
const BG   = '#060c18'
const BORDER = 'rgba(255,255,255,0.05)'

// ── Icons ────────────────────────────────────────────────────
function Icon({ d, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const ICONS = {
  dashboard: 'M2 2.5A.5.5 0 012.5 2h4a.5.5 0 01.5.5v4a.5.5 0 01-.5.5h-4a.5.5 0 01-.5-.5v-4zm7 0a.5.5 0 01.5-.5h4a.5.5 0 01.5.5v4a.5.5 0 01-.5.5h-4a.5.5 0 01-.5-.5v-4zM2 9.5A.5.5 0 012.5 9h4a.5.5 0 01.5.5v4a.5.5 0 01-.5.5h-4a.5.5 0 01-.5-.5v-4zm7 0a.5.5 0 01.5-.5h4a.5.5 0 01.5.5v4a.5.5 0 01-.5.5h-4a.5.5 0 01-.5-.5v-4z',
  ai:        'M2 2.5A1.5 1.5 0 013.5 1h9A1.5 1.5 0 0114 2.5v7A1.5 1.5 0 0112.5 11H9l-3 3v-3H3.5A1.5 1.5 0 012 9.5v-7zM5 6h6M5 8.5h3.5',
  plan:      'M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v9A1.5 1.5 0 0112.5 14h-9A1.5 1.5 0 012 12.5v-9zM5.5 8l2 2 3-3M5 5h6',
  pnl:       'M2 3h12M2 3v10a1 1 0 001 1h10a1 1 0 001-1V3M5 1.5v3M11 1.5v3M4 8l2.5 2.5L9 7.5l2.5 2',
  journal:   'M3 1h10a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1zm2 4h6M5 7.5h6M5 10h3.5',
  analytics: 'M2 12l3.5-4 3 3 3-5.5 2.5 2.5M2 14h12',
}

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'ai',        label: 'AI Coach',  icon: 'ai' },
    ],
  },
  {
    label: 'Daily',
    items: [
      { id: 'plan',    label: 'Daily Plan', icon: 'plan' },
      { id: 'journal', label: 'Journal',    icon: 'journal' },
    ],
  },
  {
    label: 'Track',
    items: [
      { id: 'pnl',       label: 'P&L Calendar', icon: 'pnl' },
      { id: 'analytics', label: 'Analytics',     icon: 'analytics' },
    ],
  },
]

export default function Sidebar({ activePage, setActivePage }) {
  const { user, profile, signOut } = useAuth()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?'

  const isActive = id => activePage === id

  return (
    <aside style={{
      width: '220px',
      flexShrink: 0,
      background: BG,
      borderRight: `1px solid ${BORDER}`,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: '18px 16px 16px',
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
      }}>
        <div style={{
          width: '26px', height: '26px', borderRadius: '8px',
          background: 'linear-gradient(135deg, #22d3ee, #6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: '800', color: '#060c18',
          flexShrink: 0,
        }}>M</div>
        <span style={{ fontSize: '14px', fontWeight: '700', color: T1, letterSpacing: '-0.3px' }}>
          MaxTradeAI
        </span>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <div style={{
              fontSize: '9.5px',
              fontWeight: '700',
              color: T3,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              padding: '0 8px',
              marginBottom: '4px',
            }}>
              {group.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {group.items.map(({ id, label, icon }) => {
                const active = isActive(id)
                return (
                  <button
                    key={id}
                    onClick={() => setActivePage(id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '7px 8px 7px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      borderLeft: active ? `2px solid ${C}` : '2px solid transparent',
                      background: active ? 'rgba(34,211,238,0.08)' : 'transparent',
                      color: active ? C : T2,
                      fontSize: '13px',
                      fontWeight: active ? '600' : '400',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      fontFamily: 'inherit',
                      letterSpacing: '-0.01em',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                        e.currentTarget.style.color = T1
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = T2
                      }
                    }}
                  >
                    <Icon d={ICONS[icon]} />
                    <span>{label}</span>
                    {active && (
                      <div style={{
                        marginLeft: 'auto',
                        width: '4px', height: '4px',
                        borderRadius: '50%',
                        background: C,
                        boxShadow: `0 0 6px ${C}`,
                      }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User footer ── */}
      <div style={{
        padding: '10px 8px 14px',
        borderTop: `1px solid ${BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {/* Subscription badge */}
        {profile?.subscription_status === 'active' && (
          <div style={{
            margin: '0 4px',
            padding: '5px 10px',
            background: 'rgba(34,211,238,0.06)',
            border: '1px solid rgba(34,211,238,0.15)',
            borderRadius: '7px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{ fontSize: '9px', color: C }}>●</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: C }}>Pro Active</span>
          </div>
        )}

        {/* User row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '4px 4px' }}>
          <div style={{
            width: '28px', height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(99,102,241,0.2))',
            border: '1px solid rgba(34,211,238,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: '700', color: C,
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            {profile?.full_name && (
              <div style={{ fontSize: '11.5px', fontWeight: '600', color: T1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
                {profile.full_name}
              </div>
            )}
            <div style={{ fontSize: '10.5px', color: T3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          style={{
            width: '100%',
            background: 'transparent',
            border: `1px solid ${BORDER}`,
            color: T3,
            fontSize: '11.5px',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '7px',
            borderRadius: '7px',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.07)'
            e.currentTarget.style.color = '#fca5a5'
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = T3
            e.currentTarget.style.borderColor = BORDER
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
