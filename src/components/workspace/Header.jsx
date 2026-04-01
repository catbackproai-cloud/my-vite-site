const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#64748b'

const pageTitles = {
  ai: 'AI Coach',
  pnl: 'P&L Calendar',
  journal: 'Journal',
}

const pageDescriptions = {
  ai: 'Your personal trading coach',
  pnl: 'Track your daily performance',
  journal: 'Reflect and improve',
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default function Header({ activePage }) {
  const today = new Date()

  return (
    <header style={{
      background: '#030c1a',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      padding: '14px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div>
        <h1 style={{
          fontSize: '15px',
          fontWeight: '600',
          color: TEXT_PRIMARY,
          margin: 0,
          letterSpacing: '-0.02em',
        }}>
          {pageTitles[activePage] || 'Workspace'}
        </h1>
        <p style={{
          fontSize: '12px',
          color: TEXT_MUTED,
          marginTop: '1px',
          letterSpacing: '-0.01em',
        }}>
          {pageDescriptions[activePage] || ''}
        </p>
      </div>
      <span style={{
        fontSize: '12px',
        color: TEXT_MUTED,
        letterSpacing: '-0.01em',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '4px 10px',
        borderRadius: '6px',
      }}>
        {formatDate(today)}
      </span>
    </header>
  )
}
