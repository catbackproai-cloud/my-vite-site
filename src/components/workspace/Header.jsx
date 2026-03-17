const BG_MID = '#030817'
const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#94a3b8'

const pageTitles = {
  ai: 'AI Coach',
  pnl: 'P&L Calendar',
  journal: 'Journal',
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function Header({ activePage }) {
  const today = new Date()

  return (
    <header style={{
      background: BG_MID,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <h1 style={{
        fontSize: '16px',
        fontWeight: '700',
        color: TEXT_PRIMARY,
        margin: 0,
      }}>
        {pageTitles[activePage] || 'Workspace'}
      </h1>
      <span style={{ fontSize: '13px', color: TEXT_MUTED }}>
        {formatDate(today)}
      </span>
    </header>
  )
}
