import { useAuth } from '../../context/AuthContext'

const CYAN = '#22d3ee'
const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#64748b'

function IconAI() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 2.5A1.5 1.5 0 013.5 1h9A1.5 1.5 0 0114 2.5v7A1.5 1.5 0 0112.5 11H9l-3 3v-3H3.5A1.5 1.5 0 012 9.5v-7z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round"/>
      <path d="M5 6h6M5 8.5h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="4.5" y="8.5" width="2" height="2" rx="0.5" fill="currentColor"/>
      <rect x="7.5" y="8.5" width="2" height="2" rx="0.5" fill="currentColor"/>
    </svg>
  )
}

function IconJournal() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6 5h4M6 7.5h4M6 10h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

const navItems = [
  { id: 'ai', label: 'AI Coach', Icon: IconAI },
  { id: 'pnl', label: 'P&L Calendar', Icon: IconCalendar },
  { id: 'journal', label: 'Journal', Icon: IconJournal },
]

export default function Sidebar({ activePage, setActivePage }) {
  const { user, profile, signOut } = useAuth()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?'

  return (
    <aside style={{
      width: '216px',
      flexShrink: 0,
      background: '#060f1e',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{
          fontSize: '15px',
          fontWeight: '700',
          color: CYAN,
          letterSpacing: '-0.3px',
        }}>
          MaxTradeAI
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {navItems.map(({ id, label, Icon }) => {
          const isActive = activePage === id
          return (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className="nav-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: '8px 10px',
                borderRadius: '7px',
                border: 'none',
                background: isActive ? 'rgba(34,211,238,0.09)' : 'transparent',
                color: isActive ? CYAN : TEXT_MUTED,
                fontSize: '13.5px',
                fontWeight: isActive ? '500' : '400',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                fontFamily: 'inherit',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = '#94a3b8'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = TEXT_MUTED
                }
              }}
            >
              <Icon />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div style={{
        padding: '12px 12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(59,130,246,0.25))',
            border: '1px solid rgba(34,211,238,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: '600',
            color: CYAN,
            flexShrink: 0,
            letterSpacing: '0.02em',
          }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            {profile?.full_name && (
              <div style={{
                fontSize: '12px',
                fontWeight: '500',
                color: TEXT_PRIMARY,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                letterSpacing: '-0.01em',
              }}>
                {profile.full_name}
              </div>
            )}
            <div style={{
              fontSize: '11px',
              color: TEXT_MUTED,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="nav-item"
          style={{
            width: '100%',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.06)',
            color: TEXT_MUTED,
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '7px',
            borderRadius: '7px',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
            e.currentTarget.style.color = '#fca5a5'
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = TEXT_MUTED
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
