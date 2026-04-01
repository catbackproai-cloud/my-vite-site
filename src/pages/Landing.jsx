import { useNavigate } from 'react-router-dom'

const CYAN = '#22d3ee'
const BG = '#020617'
const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#64748b'
const TEXT_SECONDARY = '#94a3b8'
const BORDER = 'rgba(255,255,255,0.06)'

function IconBrain() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2a4 4 0 00-4 4v.5A3.5 3.5 0 003 10a3.5 3.5 0 002.5 3.36V14a4 4 0 008 0v-.64A3.5 3.5 0 0017 10a3.5 3.5 0 00-3-3.45V6a4 4 0 00-4-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M10 2v12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M6.5 7.5h7M6.5 10.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function IconChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2 8h16" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M6 2v2M14 2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <rect x="5" y="11" width="2.5" height="3" rx="0.5" fill="currentColor"/>
      <rect x="8.75" y="10" width="2.5" height="4" rx="0.5" fill="currentColor"/>
      <rect x="12.5" y="12" width="2.5" height="2" rx="0.5" fill="currentColor"/>
    </svg>
  )
}

function IconBook() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

const features = [
  {
    Icon: IconBrain,
    title: 'AI That Knows You',
    desc: 'Your AI coach learns your strategy, rules, and tendencies. Every response is tailored to your specific trading plan — not generic advice.',
  },
  {
    Icon: IconChart,
    title: 'P&L Calendar',
    desc: 'See your daily performance at a glance. Know your best and worst days, spot patterns, and track your growth over time.',
  },
  {
    Icon: IconBook,
    title: 'Trading Journal',
    desc: 'Build elite habits with structured daily reflection. The AI reads your journal and adapts its coaching to your patterns.',
  },
]

const steps = [
  { num: '01', title: 'Set your trading plan', desc: 'Tell the AI your strategy, rules, and goals once. It remembers everything.' },
  { num: '02', title: 'Chat & share your trades', desc: 'Send messages or drop in chart screenshots. Get coaching that references your actual plan.' },
  { num: '03', title: 'Track & improve', desc: 'Log your P&L, journal your sessions, and let the AI spot patterns in your trading.' },
]

const pricingFeatures = [
  'Personal AI coach that adapts to your style',
  'Send charts & get plan-specific feedback',
  'Full conversation history — it remembers',
  'Daily P&L calendar & tracking',
  'Structured trading journal',
  'Cancel anytime',
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ background: BG, minHeight: '100vh', color: TEXT_PRIMARY }}>

      {/* Nav */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        height: '60px',
        background: 'rgba(2,6,23,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <span style={{ fontSize: '16px', fontWeight: '700', color: CYAN, letterSpacing: '-0.4px' }}>
          MaxTradeAI
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => navigate('/login')}
            className="btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: TEXT_SECONDARY,
              fontSize: '13.5px',
              fontWeight: '500',
              padding: '8px 16px',
              borderRadius: '8px',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => e.currentTarget.style.color = TEXT_PRIMARY}
            onMouseLeave={e => e.currentTarget.style.color = TEXT_SECONDARY}
          >
            Log in
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="btn"
            style={{
              background: CYAN,
              color: BG,
              border: 'none',
              fontSize: '13.5px',
              fontWeight: '600',
              padding: '8px 18px',
              borderRadius: '8px',
              boxShadow: '0 0 20px rgba(34,211,238,0.2)',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Start Free Trial
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="dot-grid"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: '100vh',
          padding: '120px 24px 80px',
          overflow: 'hidden',
        }}
      >
        {/* Radial glow */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '500px',
          background: 'radial-gradient(ellipse at center, rgba(34,211,238,0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '28%',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.05) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: '720px' }} className="fade-in">
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(34,211,238,0.07)',
            border: '1px solid rgba(34,211,238,0.18)',
            borderRadius: '999px',
            padding: '5px 14px',
            marginBottom: '36px',
            fontSize: '11.5px',
            fontWeight: '500',
            color: CYAN,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            <span style={{ fontSize: '8px' }}>●</span>
            <span>Your Personal AI Trading Coach</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(38px, 5.5vw, 68px)',
            fontWeight: '700',
            lineHeight: '1.1',
            letterSpacing: '-2.5px',
            marginBottom: '22px',
            background: `linear-gradient(160deg, ${TEXT_PRIMARY} 0%, rgba(148,163,184,0.65) 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            An AI Coach That<br />
            <span style={{
              background: `linear-gradient(135deg, ${CYAN} 0%, #60a5fa 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Knows Your Game.</span>
          </h1>

          <p style={{
            fontSize: '17px',
            lineHeight: '1.65',
            color: TEXT_SECONDARY,
            maxWidth: '500px',
            margin: '0 auto 40px',
            letterSpacing: '-0.01em',
          }}>
            Tell it your strategy once. Then chat, share charts, and get feedback that actually holds you to your plan — not generic tips.
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/signup')}
              className="btn"
              style={{
                background: CYAN,
                color: BG,
                border: 'none',
                fontSize: '15px',
                fontWeight: '600',
                padding: '13px 30px',
                borderRadius: '10px',
                boxShadow: '0 0 36px rgba(34,211,238,0.22)',
                letterSpacing: '-0.02em',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Start Free Trial →
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: TEXT_SECONDARY,
                border: `1px solid ${BORDER}`,
                fontSize: '15px',
                fontWeight: '500',
                padding: '13px 30px',
                borderRadius: '10px',
                letterSpacing: '-0.02em',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = TEXT_PRIMARY }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT_SECONDARY }}
            >
              Log in
            </button>
          </div>

          {/* Pillars */}
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            marginTop: '56px',
            flexWrap: 'wrap',
          }}>
            {[
              { icon: '✦', label: 'Plan-aware coaching' },
              { icon: '✦', label: 'Chart analysis via AI' },
              { icon: '✦', label: 'Journal & P&L tracking' },
            ].map(p => (
              <div key={p.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${BORDER}`,
                borderRadius: '999px',
                padding: '7px 16px',
                fontSize: '12.5px',
                color: TEXT_MUTED,
                fontWeight: '400',
                letterSpacing: '-0.01em',
              }}>
                <span style={{ fontSize: '7px', color: CYAN }}>{p.icon}</span>
                <span>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '100px 24px', maxWidth: '1060px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 40px)',
            fontWeight: '700',
            letterSpacing: '-1.5px',
            marginBottom: '12px',
          }}>
            Everything you need to level up
          </h2>
          <p style={{ color: TEXT_SECONDARY, fontSize: '15px', letterSpacing: '-0.01em' }}>
            Three powerful tools, one seamless workspace.
          </p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {features.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="card-hover"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${BORDER}`,
                borderRadius: '14px',
                padding: '28px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(34,211,238,0.2)'
                e.currentTarget.style.boxShadow = '0 0 30px rgba(34,211,238,0.04)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = BORDER
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                background: 'rgba(34,211,238,0.08)',
                border: '1px solid rgba(34,211,238,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: CYAN,
                marginBottom: '18px',
              }}>
                <Icon />
              </div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '8px',
                color: TEXT_PRIMARY,
                letterSpacing: '-0.03em',
              }}>
                {title}
              </h3>
              <p style={{ color: TEXT_SECONDARY, fontSize: '14px', lineHeight: '1.65', letterSpacing: '-0.01em' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{
        padding: '80px 24px',
        background: 'rgba(255,255,255,0.01)',
        borderTop: `1px solid ${BORDER}`,
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{
              fontSize: 'clamp(26px, 4vw, 38px)',
              fontWeight: '700',
              letterSpacing: '-1.5px',
              marginBottom: '10px',
            }}>
              How it works
            </h2>
            <p style={{ color: TEXT_SECONDARY, fontSize: '14px', letterSpacing: '-0.01em' }}>
              From zero to coached in under a minute.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '40px',
          }}>
            {steps.map(s => (
              <div key={s.num} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: CYAN,
                  letterSpacing: '0.1em',
                }}>
                  {s.num}
                </div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: TEXT_PRIMARY,
                  letterSpacing: '-0.03em',
                }}>
                  {s.title}
                </h3>
                <p style={{ color: TEXT_SECONDARY, fontSize: '14px', lineHeight: '1.65', letterSpacing: '-0.01em' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 38px)',
            fontWeight: '700',
            letterSpacing: '-1.5px',
            marginBottom: '10px',
          }}>
            Simple pricing
          </h2>
          <p style={{ color: TEXT_SECONDARY, fontSize: '14px', marginBottom: '44px', letterSpacing: '-0.01em' }}>
            One plan. Everything included.
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(34,211,238,0.15)',
            borderRadius: '16px',
            padding: '36px',
            boxShadow: '0 0 60px rgba(34,211,238,0.05), 0 0 0 1px rgba(255,255,255,0.03)',
          }}>
            <div style={{ marginBottom: '6px' }}>
              <span style={{
                fontSize: '44px',
                fontWeight: '700',
                color: TEXT_PRIMARY,
                letterSpacing: '-2px',
              }}>
                $19.99
              </span>
              <span style={{ color: TEXT_MUTED, fontSize: '13px', marginLeft: '4px' }}>/month</span>
            </div>
            <p style={{ color: TEXT_MUTED, fontSize: '12.5px', marginBottom: '28px', letterSpacing: '-0.01em' }}>
              Cancel anytime. No contracts.
            </p>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '11px',
              marginBottom: '28px',
              textAlign: 'left',
            }}>
              {pricingFeatures.map(f => (
                <div key={f} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13.5px',
                  color: TEXT_PRIMARY,
                  letterSpacing: '-0.01em',
                }}>
                  <span style={{
                    color: CYAN,
                    fontWeight: '600',
                    flexShrink: 0,
                    fontSize: '12px',
                  }}>✓</span>
                  {f}
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/signup')}
              className="btn"
              style={{
                width: '100%',
                background: CYAN,
                color: BG,
                border: 'none',
                fontSize: '15px',
                fontWeight: '600',
                padding: '13px',
                borderRadius: '9px',
                boxShadow: '0 0 24px rgba(34,211,238,0.18)',
                letterSpacing: '-0.02em',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Start Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${BORDER}`,
        padding: '28px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: CYAN, letterSpacing: '-0.3px' }}>MaxTradeAI</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <span style={{ color: TEXT_MUTED, fontSize: '12.5px', letterSpacing: '-0.01em' }}>
            © {new Date().getFullYear()} MaxTradeAI. All rights reserved.
          </span>
          <a
            href="mailto:orbitalbiz1@gmail.com"
            style={{ color: TEXT_MUTED, fontSize: '12.5px', textDecoration: 'none', letterSpacing: '-0.01em' }}
            onMouseEnter={e => e.target.style.color = TEXT_SECONDARY}
            onMouseLeave={e => e.target.style.color = TEXT_MUTED}
          >
            Contact
          </a>
        </div>
      </footer>
    </div>
  )
}
