import { Link } from 'react-router-dom'

const CYAN = '#22d3ee'
const BG_DEEP = '#020617'
const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#94a3b8'

const sections = [
  {
    title: '1. Information We Collect',
    body: `We collect information you provide directly: your name, email address, and payment information (processed securely by Stripe — we never store your card details). We also collect the trading data, journal entries, and P&L information you enter into the platform, as well as chart images you upload for AI analysis.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use your information to provide and improve the MaxTradeAI service, personalize your AI coaching experience, process your subscription payments, send service-related emails (account confirmation, billing), and respond to support requests. We do not sell your data to third parties.`,
  },
  {
    title: '3. AI & Data Processing',
    body: `Chart images and messages you send to the AI coach are processed by Anthropic's Claude API to generate coaching responses. Your trading data is used to build context for your personalized AI coaching. We do not use your data to train AI models.`,
  },
  {
    title: '4. Data Storage & Security',
    body: `Your data is stored securely using Supabase (PostgreSQL database with row-level security). We use industry-standard encryption for data in transit (HTTPS) and at rest. Access to your data is restricted to your account only.`,
  },
  {
    title: '5. Third-Party Services',
    body: `We use the following third-party services: Stripe for payment processing, Supabase for database and authentication, Anthropic (Claude) for AI coaching, and Netlify for hosting. Each of these services has their own privacy policies governing how they handle data.`,
  },
  {
    title: '6. Data Retention',
    body: `We retain your account data for as long as your account is active. If you cancel your subscription and close your account, we will delete your personal data within 30 days upon request. Aggregated, anonymized data may be retained for analytics purposes.`,
  },
  {
    title: '7. Your Rights',
    body: `You have the right to access, correct, or delete your personal data at any time. You can export your trading journal and P&L data from your account settings. To request account deletion, contact us at support@maxtradeai.com.`,
  },
  {
    title: '8. Cookies',
    body: `We use only essential cookies required for authentication and session management. We do not use tracking or advertising cookies.`,
  },
  {
    title: '9. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice within the app. Continued use of MaxTradeAI after changes constitutes acceptance.`,
  },
  {
    title: '10. Contact',
    body: `For privacy-related questions or data requests, contact us at support@maxtradeai.com.`,
  },
]

export default function Privacy() {
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
            Privacy Policy
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
