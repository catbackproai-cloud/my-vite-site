import { Link } from 'react-router-dom'

const CYAN = '#22d3ee'
const BG_DEEP = '#020617'
const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#94a3b8'

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: `By creating an account and accessing MaxTradeAI, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.`,
  },
  {
    title: '2. Description of Service',
    body: `MaxTradeAI is an AI-powered trading journal platform that provides personalized coaching, trade analysis, P&L tracking, and journaling tools. The AI coaching is provided for informational and educational purposes only and does not constitute financial advice.`,
  },
  {
    title: '3. Not Financial Advice',
    body: `Nothing on MaxTradeAI constitutes financial, investment, legal, or tax advice. All AI-generated feedback is educational in nature. You are solely responsible for your trading decisions and any resulting gains or losses. Always consult a qualified financial professional before making investment decisions.`,
  },
  {
    title: '4. Subscription & Billing',
    body: `MaxTradeAI offers a monthly subscription at $19.99/month. Your subscription renews automatically each billing cycle. You may cancel at any time through your account settings. Cancellation takes effect at the end of the current billing period. No refunds are issued for partial months.`,
  },
  {
    title: '5. Account Responsibilities',
    body: `You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. You must be at least 18 years old to use this service.`,
  },
  {
    title: '6. Acceptable Use',
    body: `You agree not to misuse the platform, attempt to reverse-engineer any part of the service, share your account with others, or use the service for any unlawful purpose. We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    title: '7. Intellectual Property',
    body: `All content, branding, and technology associated with MaxTradeAI is owned by MaxTradeAI. Your trading data and journal entries remain yours. You grant us a limited license to process your data solely to provide the service.`,
  },
  {
    title: '8. Limitation of Liability',
    body: `To the maximum extent permitted by law, MaxTradeAI shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service, including any trading losses.`,
  },
  {
    title: '9. Changes to Terms',
    body: `We may update these Terms at any time. Continued use of the service after changes constitutes acceptance of the new terms. We will make reasonable efforts to notify users of material changes.`,
  },
  {
    title: '10. Contact',
    body: `For questions about these Terms, contact us at support@maxtradeai.com.`,
  },
]

export default function Terms() {
  return (
    <div style={{ background: BG_DEEP, minHeight: '100vh', color: TEXT_PRIMARY }}>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: '64px',
        background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '20px', fontWeight: '800', color: CYAN, letterSpacing: '-0.5px' }}>
            MaxTradeAI
          </span>
        </Link>
        <Link to="/signup" style={{ textDecoration: 'none', color: TEXT_MUTED, fontSize: '14px' }}>
          ← Back to signup
        </Link>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '8px' }}>
            Terms of Service
          </h1>
          <p style={{ color: TEXT_MUTED, fontSize: '14px' }}>Last updated: March 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
          {sections.map(s => (
            <div key={s.title}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: TEXT_PRIMARY, marginBottom: '10px' }}>
                {s.title}
              </h2>
              <p style={{ color: TEXT_MUTED, fontSize: '14px', lineHeight: '1.75' }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 40px',
        textAlign: 'center',
      }}>
        <span style={{ color: TEXT_MUTED, fontSize: '13px' }}>
          © {new Date().getFullYear()} MaxTradeAI. All rights reserved.
        </span>
      </footer>
    </div>
  )
}
