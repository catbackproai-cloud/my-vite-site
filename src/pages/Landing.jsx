import { useNavigate } from 'react-router-dom'

const CYAN = '#22d3ee'
const BG = '#020617'
const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#64748b'
const TEXT_SECONDARY = '#94a3b8'
const BORDER = 'rgba(255,255,255,0.06)'

const pricingFeatures = [
  'Personal AI coach that adapts to your style',
  'Send charts & get plan-specific feedback',
  'Full conversation history — it remembers',
  'Daily P&L calendar & tracking',
  'Structured trading journal',
  'Cancel anytime',
]

function AppMockup() {
  return (
    <div style={{
      width: '100%',
      maxWidth: '680px',
      margin: '60px auto 0',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 40px 80px rgba(0,0,0,0.6), 0 0 80px rgba(34,211,238,0.06)',
      background: '#060f1e',
      position: 'relative',
    }}>
      {/* Toolbar */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: '#07101f',
      }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{
          flex: 1,
          textAlign: 'center',
          fontSize: '11px',
          color: TEXT_MUTED,
          letterSpacing: '-0.01em',
        }}>
          AI Coach — MaxTradeAI
        </div>
      </div>

      {/* Chat area */}
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* User message */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            background: 'rgba(34,211,238,0.1)',
            border: '1px solid rgba(34,211,238,0.2)',
            borderRadius: '16px 16px 4px 16px',
            padding: '10px 14px',
            fontSize: '13px',
            color: TEXT_PRIMARY,
            maxWidth: '75%',
            lineHeight: '1.5',
          }}>
            I entered a long NQ at 19,840 but I didn't wait for the 15m confirmation. Ended up stopping out at -$400.
          </div>
        </div>

        {/* AI response */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            flexShrink: 0,
          }}>📈</div>
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '4px 16px 16px 16px',
            padding: '12px 14px',
            fontSize: '13px',
            color: TEXT_PRIMARY,
            maxWidth: '80%',
            lineHeight: '1.6',
          }}>
            <span style={{ color: '#fca5a5', fontWeight: '500' }}>This breaks your rule #2</span> — "No entries without 15m bar confirmation." You know this setup. The level was valid but the execution wasn't. What was going through your head before you clicked buy?
          </div>
        </div>

        {/* Input bar */}
        <div style={{
          marginTop: '4px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ fontSize: '13px', color: TEXT_MUTED, flex: 1, letterSpacing: '-0.01em' }}>
            Ask your coach anything...
          </span>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '7px',
            background: CYAN,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            color: BG,
          }}>↑</div>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ background: BG, minHeight: '100vh', color: TEXT_PRIMARY }}>

      {/* Nav */}
      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        height: '60px',
        background: 'rgba(2,6,23,0.9)',
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
              background: 'transparent', border: 'none', color: TEXT_SECONDARY,
              fontSize: '13.5px', fontWeight: '500', padding: '8px 16px', borderRadius: '8px',
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
              background: CYAN, color: BG, border: 'none',
              fontSize: '13.5px', fontWeight: '600', padding: '8px 18px', borderRadius: '8px',
              boxShadow: '0 0 20px rgba(34,211,238,0.2)',
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
          textAlign: 'center',
          padding: '140px 24px 100px',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', top: '0', left: '50%',
          transform: 'translateX(-50%)',
          width: '800px', height: '600px',
          background: 'radial-gradient(ellipse at center, rgba(34,211,238,0.09) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: '760px' }} className="fade-in">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(34,211,238,0.07)',
            border: '1px solid rgba(34,211,238,0.18)',
            borderRadius: '999px',
            padding: '5px 14px', marginBottom: '32px',
            fontSize: '11.5px', fontWeight: '500', color: CYAN,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            <span style={{ fontSize: '7px' }}>●</span>
            <span>AI-Powered Trading Coach</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(44px, 6.5vw, 80px)',
            fontWeight: '800',
            lineHeight: '1.05',
            letterSpacing: '-3px',
            marginBottom: '24px',
          }}>
            <span style={{
              background: `linear-gradient(160deg, ${TEXT_PRIMARY} 30%, rgba(148,163,184,0.5) 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Stop trading without<br />
            </span>
            <span style={{
              background: `linear-gradient(135deg, ${CYAN} 0%, #818cf8 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              a real coach.
            </span>
          </h1>

          <p style={{
            fontSize: '18px', lineHeight: '1.65',
            color: TEXT_SECONDARY,
            maxWidth: '520px', margin: '0 auto 40px',
            letterSpacing: '-0.02em',
          }}>
            An AI that learns your strategy, holds you to your rules, and coaches you on every trade — not generic advice.
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/signup')}
              className="btn"
              style={{
                background: CYAN, color: BG, border: 'none',
                fontSize: '15px', fontWeight: '700',
                padding: '14px 32px', borderRadius: '10px',
                boxShadow: '0 0 40px rgba(34,211,238,0.25)',
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
                background: 'rgba(255,255,255,0.04)', color: TEXT_SECONDARY,
                border: `1px solid ${BORDER}`, fontSize: '15px', fontWeight: '500',
                padding: '14px 32px', borderRadius: '10px', letterSpacing: '-0.02em',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = TEXT_PRIMARY }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT_SECONDARY }}
            >
              Log in
            </button>
          </div>

          <AppMockup />
        </div>
      </section>

      {/* Bento features */}
      <section style={{ padding: '100px 24px', maxWidth: '1040px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: '800', letterSpacing: '-2px', marginBottom: '12px',
          }}>
            Everything in one place
          </h2>
          <p style={{ color: TEXT_SECONDARY, fontSize: '15px', letterSpacing: '-0.01em' }}>
            Three tools built around one goal: making you a better trader.
          </p>
        </div>

        {/* Bento grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px' }}>

          {/* Big card - AI Coach */}
          <div style={{
            gridColumn: 'span 7',
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${BORDER}`,
            borderRadius: '16px',
            padding: '32px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: '300px', height: '300px',
              background: 'radial-gradient(ellipse at top right, rgba(34,211,238,0.05) 0%, transparent 60%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', marginBottom: '20px',
            }}>🧠</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.04em' }}>
              AI That Knows Your Plan
            </h3>
            <p style={{ color: TEXT_SECONDARY, fontSize: '14px', lineHeight: '1.65', letterSpacing: '-0.01em', maxWidth: '340px' }}>
              Your AI coach learns your exact strategy, entry rules, and risk parameters. Every message, every chart, every trade gets evaluated against <em>your</em> specific plan.
            </p>
            <div style={{
              marginTop: '24px',
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${BORDER}`,
              borderRadius: '10px',
              padding: '14px',
              fontSize: '13px',
              color: TEXT_SECONDARY,
              lineHeight: '1.6',
            }}>
              <span style={{ color: CYAN, fontWeight: '500' }}>Coach →</span> "This breaks your rule about no trades after 11am. You've done this 3 times this week — what's driving it?"
            </div>
          </div>

          {/* P&L Calendar */}
          <div style={{
            gridColumn: 'span 5',
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${BORDER}`,
            borderRadius: '16px',
            padding: '32px',
          }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', marginBottom: '20px',
            }}>📅</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.04em' }}>
              P&L Calendar
            </h3>
            <p style={{ color: TEXT_SECONDARY, fontSize: '14px', lineHeight: '1.65', letterSpacing: '-0.01em' }}>
              See every trading day at a glance. Know your best days, worst days, and the patterns in between.
            </p>
            {/* Mini calendar mockup */}
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {[null,null,'−$120','+$340','+$210',null,null,'+$180','+$90','−$200','+$420','+$310','−$80',null].map((val, i) => (
                <div key={i} style={{
                  height: '28px',
                  borderRadius: '5px',
                  background: val === null ? 'transparent' : val.startsWith('+') ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
                  border: val === null ? 'none' : val.startsWith('+') ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(239,68,68,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '8px',
                  color: val === null ? 'transparent' : val.startsWith('+') ? '#4ade80' : '#f87171',
                  fontWeight: '600',
                }} />
              ))}
            </div>
          </div>

          {/* Journal */}
          <div style={{
            gridColumn: 'span 12',
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${BORDER}`,
            borderRadius: '16px',
            padding: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '40px',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', marginBottom: '20px',
              }}>📓</div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.04em' }}>
                Trading Journal
              </h3>
              <p style={{ color: TEXT_SECONDARY, fontSize: '14px', lineHeight: '1.65', letterSpacing: '-0.01em', maxWidth: '400px' }}>
                Log what you learned, what you need to fix. The AI reads your journal entries and brings them into your coaching — spotting patterns you'd miss yourself.
              </p>
            </div>
            <div style={{
              flexShrink: 0,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${BORDER}`,
              borderRadius: '12px',
              padding: '20px',
              width: '300px',
            }}>
              {[
                { label: 'What I learned', value: 'Patience at key levels pays. Didn\'t chase today.' },
                { label: 'What to improve', value: 'Still moved stop too early on the 10am trade.' },
              ].map(row => (
                <div key={row.label} style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '600', color: TEXT_MUTED, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{row.label}</div>
                  <div style={{ fontSize: '13px', color: TEXT_SECONDARY, lineHeight: '1.5' }}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>
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
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '10px' }}>
              How it works
            </h2>
            <p style={{ color: TEXT_SECONDARY, fontSize: '14px' }}>From zero to coached in under a minute.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px' }}>
            {[
              { num: '01', title: 'Set your trading plan', desc: 'Tell the AI your strategy, rules, and goals once. It remembers everything.' },
              { num: '02', title: 'Chat & share your trades', desc: 'Send messages or drop in chart screenshots. Get coaching that references your actual plan.' },
              { num: '03', title: 'Track & improve', desc: 'Log your P&L, journal your sessions, and let the AI spot patterns in your trading.' },
            ].map(s => (
              <div key={s.num}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: CYAN, letterSpacing: '0.1em', marginBottom: '10px' }}>{s.num}</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: TEXT_PRIMARY, letterSpacing: '-0.03em', marginBottom: '8px' }}>{s.title}</h3>
                <p style={{ color: TEXT_SECONDARY, fontSize: '14px', lineHeight: '1.65' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '10px' }}>
            Simple pricing
          </h2>
          <p style={{ color: TEXT_SECONDARY, fontSize: '14px', marginBottom: '44px' }}>
            One plan. Everything included.
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(34,211,238,0.15)',
            borderRadius: '16px',
            padding: '36px',
            boxShadow: '0 0 60px rgba(34,211,238,0.06), 0 0 0 1px rgba(255,255,255,0.03)',
          }}>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ fontSize: '46px', fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: '-2px' }}>$19.99</span>
              <span style={{ color: TEXT_MUTED, fontSize: '13px', marginLeft: '4px' }}>/month</span>
            </div>
            <p style={{ color: TEXT_MUTED, fontSize: '12.5px', marginBottom: '28px' }}>Cancel anytime. No contracts.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '28px', textAlign: 'left' }}>
              {pricingFeatures.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: TEXT_PRIMARY }}>
                  <span style={{ color: CYAN, fontWeight: '700', flexShrink: 0, fontSize: '12px' }}>✓</span>
                  {f}
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/signup')}
              className="btn"
              style={{
                width: '100%', background: CYAN, color: BG, border: 'none',
                fontSize: '15px', fontWeight: '700', padding: '13px', borderRadius: '9px',
                boxShadow: '0 0 24px rgba(34,211,238,0.18)', letterSpacing: '-0.02em',
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
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: CYAN, letterSpacing: '-0.3px' }}>MaxTradeAI</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <span style={{ color: TEXT_MUTED, fontSize: '12.5px' }}>© {new Date().getFullYear()} MaxTradeAI. All rights reserved.</span>
          <a href="mailto:orbitalbiz1@gmail.com" style={{ color: TEXT_MUTED, fontSize: '12.5px', textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.color = TEXT_SECONDARY}
            onMouseLeave={e => e.target.style.color = TEXT_MUTED}
          >Contact</a>
        </div>
      </footer>
    </div>
  )
}
