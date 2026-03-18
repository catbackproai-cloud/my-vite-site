import { useNavigate } from 'react-router-dom'

const CYAN = '#22d3ee'
const BG_DEEP = '#020617'
const BG_MID = '#030817'

const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#94a3b8'

const features = [
  {
    icon: '🤖',
    title: 'AI That Knows You',
    desc: 'Your AI coach learns your strategy, rules, and tendencies. Every response is tailored to your specific trading plan — not generic advice.',
  },
  {
    icon: '📅',
    title: 'P&L Calendar',
    desc: 'See your daily performance at a glance. Know your best and worst days instantly.',
  },
  {
    icon: '📓',
    title: 'Trading Journal',
    desc: 'Build elite habits with structured daily reflection. Learn from every session.',
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

const pillars = [
  { icon: '🎯', label: 'Plan-aware coaching' },
  { icon: '📊', label: 'Chart analysis via AI' },
  { icon: '📓', label: 'Journal & P&L tracking' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ background: BG_DEEP, minHeight: '100vh', color: TEXT_PRIMARY }}>

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
        height: '64px',
        background: 'rgba(2, 6, 23, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px', fontWeight: '800', color: CYAN, letterSpacing: '-0.5px' }}>
            MaxTradeAI
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'transparent',
              border: 'none',
              color: TEXT_MUTED,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: '8px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = TEXT_PRIMARY}
            onMouseLeave={e => e.target.style.color = TEXT_MUTED}
          >
            Log in
          </button>
          <button
            onClick={() => navigate('/signup')}
            style={{
              background: CYAN,
              color: BG_DEEP,
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '9px 20px',
              borderRadius: '8px',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.target.style.opacity = '0.85'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            Start Free Trial
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: '100vh',
        padding: '120px 24px 80px',
        overflow: 'hidden',
      }}>
        {/* Glow bg */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '600px',
          background: 'radial-gradient(ellipse at center, rgba(34,211,238,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '30%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: '760px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(34,211,238,0.1)',
            border: '1px solid rgba(34,211,238,0.25)',
            borderRadius: '999px',
            padding: '4px 14px',
            marginBottom: '32px',
            fontSize: '12px',
            fontWeight: '600',
            color: CYAN,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            <span>✦</span>
            <span>Your Personal AI Trading Coach</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: '800',
            lineHeight: '1.08',
            letterSpacing: '-2px',
            marginBottom: '24px',
            background: `linear-gradient(135deg, ${TEXT_PRIMARY} 0%, rgba(148,163,184,0.7) 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            An AI Coach That<br />
            <span style={{
              background: `linear-gradient(135deg, ${CYAN}, #3b82f6)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Knows Your Game.</span>
          </h1>

          <p style={{
            fontSize: '18px',
            lineHeight: '1.6',
            color: TEXT_MUTED,
            maxWidth: '520px',
            margin: '0 auto 40px',
          }}>
            Tell it your strategy once. Then chat, share charts, and get feedback that actually holds you to your plan — not generic tips.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/signup')}
              style={{
                background: CYAN,
                color: BG_DEEP,
                border: 'none',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                padding: '14px 32px',
                borderRadius: '10px',
                transition: 'all 0.2s',
                boxShadow: '0 0 40px rgba(34,211,238,0.25)',
              }}
              onMouseEnter={e => { e.target.style.opacity = '0.9'; e.target.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)' }}
            >
              Start Free Trial →
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'transparent',
                color: CYAN,
                border: `1px solid rgba(34,211,238,0.35)`,
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '14px 32px',
                borderRadius: '10px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.target.style.borderColor = CYAN; e.target.style.background = 'rgba(34,211,238,0.05)' }}
              onMouseLeave={e => { e.target.style.borderColor = 'rgba(34,211,238,0.35)'; e.target.style.background = 'transparent' }}
            >
              Log in
            </button>
          </div>

          {/* Pillars row */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            marginTop: '64px',
            flexWrap: 'wrap',
          }}>
            {pillars.map(p => (
              <div key={p.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '999px',
                padding: '8px 18px',
                fontSize: '13px',
                color: TEXT_MUTED,
                fontWeight: '500',
              }}>
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{
        padding: '100px 24px',
        maxWidth: '1100px',
        margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: '800',
            letterSpacing: '-1px',
            marginBottom: '16px',
          }}>
            Everything you need to level up
          </h2>
          <p style={{ color: TEXT_MUTED, fontSize: '16px' }}>
            Three powerful tools, one seamless workspace.
          </p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {features.map(f => (
            <div key={f.title} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              padding: '32px',
              transition: 'border-color 0.2s, transform 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px', color: TEXT_PRIMARY }}>
                {f.title}
              </h3>
              <p style={{ color: TEXT_MUTED, fontSize: '14px', lineHeight: '1.6' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{
        padding: '80px 24px',
        background: BG_MID,
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: '800',
              letterSpacing: '-1px',
              marginBottom: '12px',
            }}>
              How it works
            </h2>
            <p style={{ color: TEXT_MUTED, fontSize: '15px' }}>
              From zero to coached in under a minute.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '32px',
          }}>
            {steps.map(s => (
              <div key={s.num} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: CYAN,
                  letterSpacing: '0.12em',
                }}>
                  {s.num}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: TEXT_PRIMARY }}>
                  {s.title}
                </h3>
                <p style={{ color: TEXT_MUTED, fontSize: '14px', lineHeight: '1.6' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: '440px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: '800',
            letterSpacing: '-1px',
            marginBottom: '12px',
          }}>
            Simple pricing
          </h2>
          <p style={{ color: TEXT_MUTED, fontSize: '15px', marginBottom: '48px' }}>
            One plan. Everything included.
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(34,211,238,0.2)',
            backdropFilter: 'blur(12px)',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 0 60px rgba(34,211,238,0.06)',
          }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '48px', fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: '-2px' }}>
                $19.99
              </span>
              <span style={{ color: TEXT_MUTED, fontSize: '14px', marginLeft: '4px' }}>/month</span>
            </div>
            <p style={{ color: TEXT_MUTED, fontSize: '13px', marginBottom: '32px' }}>
              Cancel anytime. No contracts.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', textAlign: 'left' }}>
              {pricingFeatures.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: TEXT_PRIMARY }}>
                  <span style={{ color: CYAN, fontWeight: '700', flexShrink: 0 }}>✓</span>
                  {f}
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/signup')}
              style={{
                width: '100%',
                background: CYAN,
                color: BG_DEEP,
                border: 'none',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                padding: '14px',
                borderRadius: '10px',
                transition: 'opacity 0.2s',
                boxShadow: '0 0 30px rgba(34,211,238,0.2)',
              }}
              onMouseEnter={e => e.target.style.opacity = '0.85'}
              onMouseLeave={e => e.target.style.opacity = '1'}
            >
              Start Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '32px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <span style={{ fontSize: '16px', fontWeight: '800', color: CYAN }}>MaxTradeAI</span>
        <span style={{ color: TEXT_MUTED, fontSize: '13px' }}>
          © {new Date().getFullYear()} MaxTradeAI. All rights reserved.
        </span>
      </footer>
    </div>
  )
}
