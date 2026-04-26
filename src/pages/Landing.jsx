import { useNavigate } from 'react-router-dom'

const C = '#22d3ee'
const BG = '#070b14'
const SURFACE = '#0f1729'
const BORDER = 'rgba(255,255,255,0.07)'
const T1 = '#f1f5f9'
const T2 = '#94a3b8'
const T3 = '#475569'

// ── Mock app window ──────────────────────────────────────────
function MockWindow({ children, title = 'MaxTradeAI' }) {
  return (
    <div style={{
      borderRadius: '14px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.09)',
      boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), 0 0 80px rgba(34,211,238,0.07)',
      background: '#0a0f1e',
    }}>
      <div style={{
        height: '40px',
        background: '#080d1a',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: '7px',
      }}>
        {['rgba(239,68,68,0.5)', 'rgba(234,179,8,0.5)', 'rgba(34,197,94,0.5)'].map((c, i) => (
          <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />
        ))}
        <span style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: T3, letterSpacing: '-0.01em' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

// ── Hero dashboard mockup ────────────────────────────────────
function HeroMockup() {
  const kpis = [
    { label: 'Total P&L', value: '+$4,820', color: '#22c55e', sub: 'Last 30 days' },
    { label: 'Win Rate', value: '67%', color: C, sub: '30 of 45 days' },
    { label: 'Discipline Score', value: '81', color: '#818cf8', sub: 'Disciplined ↑12' },
    { label: 'Streak', value: '🔥 9', color: '#f59e0b', sub: 'Days journaled' },
  ]
  return (
    <MockWindow title="MaxTradeAI — Dashboard">
      <div style={{ display: 'flex', height: '340px' }}>
        {/* Mini sidebar */}
        <div style={{
          width: '52px',
          background: '#070c18',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '16px',
          gap: '4px',
        }}>
          {['▣','◈','⊞','≡','◉'].map((ic, i) => (
            <div key={i} style={{
              width: '32px', height: '32px',
              borderRadius: '8px',
              background: i === 0 ? 'rgba(34,211,238,0.12)' : 'transparent',
              borderLeft: i === 0 ? '2px solid #22d3ee' : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px',
              color: i === 0 ? C : 'rgba(255,255,255,0.2)',
            }}>{ic}</div>
          ))}
        </div>
        {/* Main content */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'hidden' }}>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
            {kpis.map(k => (
              <div key={k.label} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '10px 10px 8px',
              }}>
                <div style={{ fontSize: '9px', color: T3, fontWeight: '600', letterSpacing: '0.05em', marginBottom: '4px', textTransform: 'uppercase' }}>{k.label}</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: k.color, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '-0.5px' }}>{k.value}</div>
                <div style={{ fontSize: '8px', color: T3, marginTop: '2px' }}>{k.sub}</div>
              </div>
            ))}
          </div>
          {/* AI insight alert */}
          <div style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '8px',
            padding: '10px 12px',
            marginBottom: '10px',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '11px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#fca5a5', marginBottom: '2px' }}>Coach flagged a pattern</div>
              <div style={{ fontSize: '10px', color: T2, lineHeight: 1.4 }}>Rule violations cost you an estimated <strong style={{ color: '#fca5a5' }}>$1,240</strong> this month. You trade 2.3× worse after 2pm.</div>
            </div>
          </div>
          {/* Mini chat preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: '10px 10px 2px 10px', padding: '7px 10px', fontSize: '10px', color: T1, maxWidth: '70%', lineHeight: 1.4 }}>
                Why do I keep losing on Fridays?
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, #22d3ee, #6366f1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>M</div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px 10px 10px 10px', padding: '7px 10px', fontSize: '10px', color: T1, maxWidth: '80%', lineHeight: 1.5 }}>
                <span style={{ color: '#fca5a5', fontWeight: '600' }}>Pattern detected:</span> Your Friday trades are 64% losers vs 41% Mon–Thu. You average 3.2 trades on Fridays vs 1.8 other days — classic overtrading before the weekend.
              </div>
            </div>
          </div>
        </div>
      </div>
    </MockWindow>
  )
}

// ── Comparison table ─────────────────────────────────────────
const COMPARE_ROWS = [
  { feature: 'AI coach that knows YOUR exact strategy', mta: true, tz: false, sheet: false },
  { feature: 'Discipline Score with dollar cost of violations', mta: true, tz: false, sheet: false },
  { feature: 'Custom confluence checklist per your setup', mta: true, tz: false, sheet: false },
  { feature: 'Pre-session bias planning', mta: true, tz: false, sheet: false },
  { feature: 'Prop firm challenge simulator', mta: true, tz: false, sheet: false },
  { feature: 'Weekly AI performance recap', mta: true, tz: 'partial', sheet: false },
  { feature: 'P&L calendar', mta: true, tz: true, sheet: 'manual' },
  { feature: 'Works with any methodology', mta: true, tz: false, sheet: false },
  { feature: 'Price', mta: '$19.99/mo', tz: '$29–49/mo', sheet: 'Free (but costly)' },
]

function CheckCell({ val }) {
  if (val === true) return <span style={{ color: '#22c55e', fontSize: '16px', fontWeight: '700' }}>✓</span>
  if (val === false) return <span style={{ color: T3, fontSize: '16px' }}>—</span>
  if (val === 'partial') return <span style={{ color: '#f59e0b', fontSize: '11px', fontWeight: '600' }}>Partial</span>
  if (val === 'manual') return <span style={{ color: T3, fontSize: '10px' }}>Manual</span>
  return <span style={{ fontSize: '11px', fontWeight: '700', color: val?.startsWith('$19') ? C : T3 }}>{val}</span>
}

// ── Main ─────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()

  const goSignup = () => navigate('/signup')
  const goLogin  = () => navigate('/login')

  return (
    <div style={{ background: BG, minHeight: '100vh', color: T1, overflowX: 'hidden' }}>

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '58px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px, 5vw, 60px)',
        background: 'rgba(7,11,20,0.85)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '7px',
            background: 'linear-gradient(135deg, #22d3ee, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: '800', color: '#070b14',
          }}>M</div>
          <span style={{ fontSize: '15px', fontWeight: '700', color: T1, letterSpacing: '-0.4px' }}>MaxTradeAI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={goLogin} className="btn" style={{ background: 'transparent', border: 'none', color: T2, fontSize: '13px', fontWeight: '500', padding: '7px 14px', borderRadius: '7px' }}
            onMouseEnter={e => e.currentTarget.style.color = T1}
            onMouseLeave={e => e.currentTarget.style.color = T2}
          >Log in</button>
          <button onClick={goSignup} className="btn" style={{
            background: C, color: BG, fontSize: '13px', fontWeight: '700',
            padding: '8px 18px', borderRadius: '8px',
            boxShadow: '0 0 20px rgba(34,211,238,0.25)',
            letterSpacing: '-0.02em',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.boxShadow = '0 0 32px rgba(34,211,238,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = '0 0 20px rgba(34,211,238,0.25)' }}
          >Join Waitlist →</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="fine-grid" style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
        padding: 'clamp(120px, 16vw, 160px) clamp(20px, 5vw, 60px) 80px',
        overflow: 'hidden',
      }}>
        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '500px', background: 'radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '0', left: '30%', width: '400px', height: '300px', background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '820px', width: '100%' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)',
            borderRadius: '999px', padding: '5px 16px 5px 10px',
            marginBottom: '28px', fontSize: '11.5px', fontWeight: '600', color: C,
            letterSpacing: '0.04em',
          }} className="fade-in">
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C, boxShadow: '0 0 6px #22d3ee' }} />
            AI Trading Coach · Works With Any Methodology
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(42px, 6.5vw, 78px)',
            fontWeight: '800',
            lineHeight: '1.04',
            letterSpacing: 'clamp(-2px, -0.04em, -3px)',
            marginBottom: '22px',
          }} className="fade-in">
            <span style={{
              background: `linear-gradient(160deg, ${T1} 0%, rgba(148,163,184,0.6) 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Your trades are trying<br />to tell you something.
            </span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #22d3ee 0%, #818cf8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Are you listening?
            </span>
          </h1>

          {/* Sub */}
          <p style={{
            fontSize: 'clamp(15px, 2vw, 19px)', lineHeight: '1.6',
            color: T2, maxWidth: '560px', margin: '0 auto 36px',
            letterSpacing: '-0.02em',
          }} className="fade-in">
            The AI coaching platform that learns your exact strategy, tracks your discipline, and tells you precisely what's costing you money.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }} className="fade-in">
            <button onClick={goSignup} className="btn" style={{
              background: C, color: BG, fontSize: '15px', fontWeight: '700',
              padding: '14px 32px', borderRadius: '10px',
              boxShadow: '0 0 40px rgba(34,211,238,0.3)',
              letterSpacing: '-0.02em',
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(34,211,238,0.45)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(34,211,238,0.3)' }}
            >
              Join the Waitlist →
            </button>
            <button onClick={goLogin} className="btn" style={{
              background: 'rgba(255,255,255,0.04)', color: T2,
              border: '1px solid rgba(255,255,255,0.09)', fontSize: '15px', fontWeight: '500',
              padding: '14px 28px', borderRadius: '10px', letterSpacing: '-0.02em',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = T1 }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = T2 }}
            >
              Log in
            </button>
          </div>

          <p style={{ fontSize: '12px', color: T3, marginBottom: '60px' }}>No credit card. No commitment. Early access only.</p>

          {/* Hero mockup */}
          <div className="float-anim" style={{ maxWidth: '760px', margin: '0 auto' }}>
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div style={{ background: SURFACE, borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '28px clamp(20px,5vw,60px)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px', textAlign: 'center' }}>
          {[
            { value: 'Any style', label: 'ICT, Price Action, Algo, Mech Models', accent: C },
            { value: '5 tools', label: 'Journal · Coach · Calendar · Analytics · Prop Sim', accent: '#818cf8' },
            { value: '$0', label: 'Cost to join the waitlist', accent: '#22c55e' },
            { value: '< 60s', label: 'From signup to your first coaching session', accent: '#f59e0b' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: '800', color: s.accent, letterSpacing: '-0.04em', fontFamily: 'IBM Plex Mono, monospace', marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '11.5px', color: T3, lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Problem section ── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,60px)', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: C, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>The Problem</div>
          <h2 style={{ fontSize: 'clamp(26px,4vw,46px)', fontWeight: '800', letterSpacing: '-0.04em', marginBottom: '14px' }}>
            Most traders journal.<br />Almost none do it right.
          </h2>
          <p style={{ color: T2, fontSize: '15px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
            You can log every trade and still not know why you're losing on Fridays, why your best setup fails when you're already down, or why your P&L looks different before 10am vs after lunch.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {[
            {
              icon: '📊', title: 'Spreadsheets can\'t coach you',
              desc: 'They show you numbers. They don\'t tell you the pattern behind the numbers, what\'s causing it, or what to do differently tomorrow.',
              tag: 'The old way'
            },
            {
              icon: '🔁', title: 'Generic AI gives generic advice',
              desc: 'If the AI doesn\'t know your methodology, it can\'t call out your violations. "Consider your risk management" helps nobody.',
              tag: 'Competitor problem'
            },
            {
              icon: '💸', title: 'Violations have a real dollar cost',
              desc: 'Traders underestimate the cumulative cost of undiscipline. Breaking your rules 8 times a month can cost more than commissions.',
              tag: 'The real damage'
            },
          ].map(p => (
            <div key={p.title} style={{
              background: 'rgba(255,255,255,0.02)',
              border: BORDER,
              borderWidth: 1, borderStyle: 'solid',
              borderRadius: '14px',
              padding: '26px',
            }}>
              <div style={{ fontSize: '26px', marginBottom: '14px' }}>{p.icon}</div>
              <div style={{
                display: 'inline-block', fontSize: '10px', fontWeight: '700', color: T3,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '4px', padding: '2px 8px', marginBottom: '10px', letterSpacing: '0.05em',
              }}>{p.tag}</div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: T1, marginBottom: '8px', letterSpacing: '-0.03em' }}>{p.title}</h3>
              <p style={{ color: T2, fontSize: '13.5px', lineHeight: '1.65' }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Features bento ── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,60px)', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: C, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>What's Inside</div>
          <h2 style={{ fontSize: 'clamp(26px,4vw,46px)', fontWeight: '800', letterSpacing: '-0.04em', marginBottom: '14px' }}>
            Five tools.<br />One platform. One price.
          </h2>
          <p style={{ color: T2, fontSize: '15px', maxWidth: '480px', margin: '0 auto' }}>Everything a serious trader needs to find their edge, track their discipline, and improve systematically.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '14px' }}>

          {/* AI Coach — big card */}
          <div style={{
            gridColumn: 'span 7',
            background: 'rgba(34,211,238,0.03)',
            border: '1px solid rgba(34,211,238,0.14)',
            borderRadius: '16px',
            padding: '28px',
            position: 'relative',
            overflow: 'hidden',
          }} className="card-hover-cyan">
            <div style={{ position: 'absolute', top: 0, right: 0, width: '260px', height: '260px', background: 'radial-gradient(ellipse at top right, rgba(34,211,238,0.07), transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(99,102,241,0.2))', border: '1px solid rgba(34,211,238,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', marginBottom: '18px' }}>🧠</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: '20px', padding: '3px 10px', marginBottom: '12px', fontSize: '10px', fontWeight: '700', color: C, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Core Feature
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.04em' }}>AI Coach That Knows Your Plan</h3>
            <p style={{ color: T2, fontSize: '13.5px', lineHeight: '1.65', maxWidth: '340px', marginBottom: '20px' }}>
              Your coach reads your trading plan, your journal entries, and your message history. Every response is framed around <em>your</em> methodology — not generic advice that could apply to anyone.
            </p>
            {/* Mock chat */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.18)', borderRadius: '12px 12px 3px 12px', padding: '8px 12px', fontSize: '12px', color: T1, maxWidth: '75%', lineHeight: 1.5 }}>
                  Took a trade before my entry signal. Lost $380.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #22d3ee, #6366f1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#070b14' }}>M</div>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '3px 12px 12px 12px', padding: '9px 12px', fontSize: '12px', color: T1, lineHeight: 1.55, maxWidth: '80%' }}>
                  <span style={{ color: '#fca5a5', fontWeight: '600' }}>Rule violation — Rule #1:</span> "No entries without setup confirmation." That's 4 times this week. What's making you enter early — FOMO, or the feeling the setup will run away?
                </div>
              </div>
            </div>
          </div>

          {/* Discipline Score */}
          <div style={{ gridColumn: 'span 5', background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '28px', position: 'relative', overflow: 'hidden' }} className="card-hover">
            <div style={{ position: 'absolute', top: 0, right: 0, width: '160px', height: '160px', background: 'radial-gradient(ellipse at top right, rgba(99,102,241,0.07), transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', marginBottom: '18px' }}>📐</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.04em' }}>Discipline Score</h3>
            <p style={{ color: T2, fontSize: '13px', lineHeight: '1.65', marginBottom: '18px' }}>A 0–100 score that measures your rule adherence — and shows the exact dollar cost of every violation.</p>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '9px', color: T3, fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '2px' }}>This Month</div>
                  <div style={{ fontSize: '36px', fontWeight: '800', color: '#818cf8', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '-1px', lineHeight: 1 }}>81</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9px', color: T3, marginBottom: '2px' }}>Violations cost</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#ef4444', fontFamily: 'IBM Plex Mono, monospace' }}>-$1,240</div>
                </div>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '81%', height: '100%', background: 'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius: '3px' }} />
              </div>
            </div>
          </div>

          {/* P&L Calendar */}
          <div style={{ gridColumn: 'span 4', background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '28px' }} className="card-hover">
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', marginBottom: '18px' }}>📅</div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.04em' }}>P&L Calendar</h3>
            <p style={{ color: T2, fontSize: '13px', lineHeight: '1.65', marginBottom: '16px' }}>Every trading day at a glance. See your best sessions, worst sessions, and streaks instantly.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
              {[null,null,'-$120','+$340','+$210',null,null,'+$180','+$90','-$200','+$420','+$310','-$80',null,'+$260','+$140','+$90',null,null,'+$380','+$200'].map((v, i) => (
                <div key={i} style={{ height: '22px', borderRadius: '4px', background: v === null ? 'transparent' : v.startsWith('+') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)', border: v === null ? 'none' : v.startsWith('+') ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.2)' }} />
              ))}
            </div>
          </div>

          {/* Daily Plan */}
          <div style={{ gridColumn: 'span 4', background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '28px' }} className="card-hover">
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', marginBottom: '18px' }}>🎯</div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.04em' }}>Pre-Session Planning</h3>
            <p style={{ color: T2, fontSize: '13px', lineHeight: '1.65', marginBottom: '16px' }}>Set your HTF bias, mark key levels, define your setup criteria — before the market opens. Trade with intention.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[['Bias', 'Bullish', '#22c55e'], ['Session', 'London / NY', C], ['Target', 'EQH at 19,880', T2]].map(([l, v, c]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: T3 }}>{l}</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: c }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Journal */}
          <div style={{ gridColumn: 'span 4', background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '28px' }} className="card-hover">
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', marginBottom: '18px' }}>📓</div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.04em' }}>Smart Journal</h3>
            <p style={{ color: T2, fontSize: '13px', lineHeight: '1.65', marginBottom: '14px' }}>Structured fields for session, setup type, confluences, and rule violations. The AI reads every entry to surface patterns over time.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {['Session ✓', 'Setup Type ✓', 'Confluence Checklist ✓', 'Rule Violated ✓'].map(t => (
                <span key={t} style={{ fontSize: '10px', fontWeight: '600', color: C, background: 'rgba(34,211,238,0.07)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: '4px', padding: '3px 7px' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Analytics */}
          <div style={{ gridColumn: 'span 6', background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '28px' }} className="card-hover">
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', marginBottom: '18px' }}>📈</div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.04em' }}>Performance Analytics</h3>
            <p style={{ color: T2, fontSize: '13px', lineHeight: '1.65', marginBottom: '16px' }}>Win rate, P&L trends, best/worst day of week, and a shareable insight card you can post. Know exactly where your edge lives and where it disappears.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[['Best Day', 'Mon +$847', '#22c55e'], ['Worst Day', 'Fri -$612', '#ef4444'], ['Best Setup', 'Pullback 71%', C]].map(([l, v, c]) => (
                <div key={l} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px', padding: '10px 10px 8px' }}>
                  <div style={{ fontSize: '9px', color: T3, marginBottom: '3px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{l}</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: c, fontFamily: 'IBM Plex Mono, monospace' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Prop Firm Sim */}
          <div style={{ gridColumn: 'span 6', background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '28px', position: 'relative', overflow: 'hidden' }} className="card-hover">
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.12)', borderRadius: '8px', padding: '4px 10px', fontSize: '9px', fontWeight: '700', color: C, letterSpacing: '0.06em' }}>UNIQUE TO MAXTRADEAI</div>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', marginBottom: '18px' }}>🏆</div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.04em' }}>Prop Firm Simulator</h3>
            <p style={{ color: T2, fontSize: '13px', lineHeight: '1.65', marginBottom: '14px' }}>Run your last 90 days through FTMO, Apex, or Topstep rules. See exactly which day you would have failed — and why — before you spend another $500 on a challenge.</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['FTMO', 'Apex', 'Topstep', 'The5ers', 'FundedNext'].map(f => (
                <span key={f} style={{ fontSize: '11px', fontWeight: '600', color: '#fbbf24', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: '4px', padding: '3px 8px' }}>{f}</span>
              ))}
            </div>
          </div>

        </div>
      </section>

      <div className="section-divider" />

      {/* ── USP comparison ── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,60px)', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: C, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>How We Compare</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,42px)', fontWeight: '800', letterSpacing: '-0.04em' }}>
            Not just another journal.
          </h2>
        </div>

        <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 140px', background: '#0f1729', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 20px', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: T3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Feature</div>
            {[
              { name: 'MaxTradeAI', highlight: true },
              { name: 'TradeZella', highlight: false },
              { name: 'Spreadsheet', highlight: false },
            ].map(col => (
              <div key={col.name} style={{ textAlign: 'center', fontSize: '12px', fontWeight: '700', color: col.highlight ? C : T3 }}>{col.name}</div>
            ))}
          </div>
          {COMPARE_ROWS.map((row, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 140px 140px 140px',
              padding: '12px 20px', gap: '8px',
              background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
              borderBottom: i < COMPARE_ROWS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              alignItems: 'center',
            }}>
              <div style={{ fontSize: '13px', color: i === COMPARE_ROWS.length - 1 ? T2 : T1, fontWeight: i === COMPARE_ROWS.length - 1 ? '600' : '400' }}>{row.feature}</div>
              <div style={{ textAlign: 'center' }}><CheckCell val={row.mta} /></div>
              <div style={{ textAlign: 'center' }}><CheckCell val={row.tz} /></div>
              <div style={{ textAlign: 'center' }}><CheckCell val={row.sheet} /></div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* ── How it works ── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,60px)', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: C, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>Getting Started</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,42px)', fontWeight: '800', letterSpacing: '-0.04em' }}>Live in under 60 seconds.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px' }}>
          {[
            { num: '01', title: 'Tell the AI your strategy', desc: 'Paste your trading rules once. The coach will hold you to them in every conversation from that point on.' },
            { num: '02', title: 'Trade, then debrief', desc: 'Send charts, describe your trades, ask anything. Every response references your actual plan — not generic theory.' },
            { num: '03', title: 'Track and see the patterns', desc: 'Your journal, P&L, and daily plans feed the AI. Over time it sees patterns you can\'t see yourself.' },
          ].map(s => (
            <div key={s.num}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: C, letterSpacing: '0.12em', fontFamily: 'IBM Plex Mono, monospace', marginBottom: '12px' }}>{s.num}</div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: T1, letterSpacing: '-0.03em', marginBottom: '8px' }}>{s.title}</h3>
              <p style={{ color: T2, fontSize: '14px', lineHeight: '1.65' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Pricing ── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,60px)', maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: C, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>Pricing</div>
        <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: '800', letterSpacing: '-0.04em', marginBottom: '8px' }}>One plan. Everything included.</h2>
        <p style={{ color: T2, fontSize: '14px', marginBottom: '44px' }}>No feature tiers. No locked AI. No upsells.</p>

        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(34,211,238,0.18)',
          borderRadius: '18px',
          padding: '36px',
          boxShadow: '0 0 80px rgba(34,211,238,0.07), 0 0 0 1px rgba(255,255,255,0.03)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '300px', height: '200px', background: 'radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.08), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '54px', fontWeight: '800', color: T1, letterSpacing: '-3px', fontFamily: 'IBM Plex Mono, monospace' }}>$19.99</span>
              <span style={{ color: T3, fontSize: '14px', marginLeft: '6px' }}>/month</span>
            </div>
            <p style={{ color: T3, fontSize: '12px', marginBottom: '28px' }}>Cancel anytime. No contracts. Early access pricing.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px', textAlign: 'left' }}>
              {[
                'AI coach that learns your exact strategy',
                'Discipline Score + dollar cost breakdown',
                'Pre-session planning with confluence tracking',
                'Smart journal with structured fields',
                'P&L calendar + performance analytics',
                'Prop firm challenge simulator',
                'Weekly AI performance recap',
                'Full chat history — the coach remembers',
                'Upload charts for visual feedback',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: T1 }}>
                  <span style={{ color: C, fontWeight: '700', flexShrink: 0, fontSize: '11px' }}>✓</span>
                  {f}
                </div>
              ))}
            </div>

            <button onClick={goSignup} className="btn" style={{
              width: '100%', background: C, color: BG,
              fontSize: '15px', fontWeight: '700', padding: '14px',
              borderRadius: '10px', boxShadow: '0 0 30px rgba(34,211,238,0.2)',
              letterSpacing: '-0.02em',
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.boxShadow = '0 0 50px rgba(34,211,238,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = '0 0 30px rgba(34,211,238,0.2)' }}
            >
              Join the Waitlist
            </button>
            <p style={{ fontSize: '11.5px', color: T3, marginTop: '12px' }}>No credit card required to join</p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,60px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(34,211,238,0.06), transparent 60%)', pointerEvents: 'none' }} />
        <div className="fine-grid" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
        <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px,4.5vw,52px)', fontWeight: '800', letterSpacing: '-0.04em', marginBottom: '16px', lineHeight: 1.1 }}>
            The traders who make it<br />
            <span style={{ background: 'linear-gradient(135deg, #22d3ee, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              don't trade harder.
            </span>
          </h2>
          <p style={{ color: T2, fontSize: '16px', lineHeight: 1.6, marginBottom: '36px' }}>
            They trade smarter. They know their edge. They know their weaknesses. They have a coach.
          </p>
          <button onClick={goSignup} className="btn" style={{
            background: C, color: BG, fontSize: '16px', fontWeight: '700',
            padding: '16px 40px', borderRadius: '12px',
            boxShadow: '0 0 50px rgba(34,211,238,0.35)',
            letterSpacing: '-0.02em',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 70px rgba(34,211,238,0.55)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 50px rgba(34,211,238,0.35)' }}
          >
            Secure Your Spot →
          </button>
          <p style={{ color: T3, fontSize: '12px', marginTop: '14px' }}>Limited early access spots · Join free · No card needed</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '28px clamp(20px,5vw,60px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'linear-gradient(135deg, #22d3ee, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: '#070b14' }}>M</div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: T1, letterSpacing: '-0.3px' }}>MaxTradeAI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <span style={{ color: T3, fontSize: '12px' }}>© {new Date().getFullYear()} MaxTradeAI. All rights reserved.</span>
          <a href="/terms" style={{ color: T3, fontSize: '12px', textDecoration: 'none' }} onMouseEnter={e => e.target.style.color = T2} onMouseLeave={e => e.target.style.color = T3}>Terms</a>
          <a href="mailto:orbitalbiz1@gmail.com" style={{ color: T3, fontSize: '12px', textDecoration: 'none' }} onMouseEnter={e => e.target.style.color = T2} onMouseLeave={e => e.target.style.color = T3}>Contact</a>
        </div>
      </footer>

    </div>
  )
}
