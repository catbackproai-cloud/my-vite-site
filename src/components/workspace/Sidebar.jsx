import { useAuth } from '../../context/AuthContext'

const CYAN = '#22d3ee'
const BG_TOP = '#07101f'
const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#94a3b8'

const navItems = [
  { id: 'ai', label: 'AI Coach', icon: '🧠' },
  { id: 'pnl', label: 'P&L Calendar', icon: '📅' },
  { id: 'journal', label: 'Journal', icon: '📓' },
]

export default function Sidebar({ activePage, setActivePage }) {
  const { user, profile, signOut } = useAuth()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?'

  return (
    <aside style={{
      width: '220px',
      flexShrink: 0,
      background: BG_TOP,
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      padding: '16px 0',
    }}>
      {/* Logo */}
      <div style={{
        padding: '8px 20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        marginBottom: '8px',
      }}>
        <span style={{ fontSize: '16px', fontWeight: '800', color: CYAN, letterSpacing: '-0.3px' }}>
          MaxTradeAI
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(item => {
          const isActive = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: isActive ? '1px solid rgba(34,211,238,0.2)' : '1px solid transparent',
                borderLeft: isActive ? `2px solid ${CYAN}` : '2px solid transparent',
                background: isActive ? 'rgba(34,211,238,0.08)' : 'transparent',
                color: isActive ? CYAN : TEXT_MUTED,
                fontSize: '14px',
                fontWeight: isActive ? '600' : '400',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = TEXT_PRIMARY
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = TEXT_MUTED
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* User section */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(34,211,238,0.3), rgba(59,130,246,0.3))',
            border: '1px solid rgba(34,211,238,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '700',
            color: CYAN,
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            {profile?.full_name && (
              <div style={{ fontSize: '12px', fontWeight: '600', color: TEXT_PRIMARY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile.full_name}
              </div>
            )}
            <div style={{ fontSize: '11px', color: TEXT_MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={signOut}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: TEXT_MUTED,
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '6px',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.target.style.background = 'rgba(239,68,68,0.1)'; e.target.style.color = '#fca5a5'; e.target.style.borderColor = 'rgba(239,68,68,0.2)' }}
          onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.color = TEXT_MUTED; e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
