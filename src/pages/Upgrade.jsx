import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const CYAN = '#22d3ee'
const BG_DEEP = '#020617'
const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#94a3b8'

const pricingFeatures = [
  'Unlimited AI chart analysis',
  'Daily P&L calendar & tracking',
  'Structured trading journal',
  'AI grades every trade A–F',
  'Cloud sync across all devices',
  'Cancel anytime',
]

export default function Upgrade() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubscribe() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          userId: user.id,
          priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    setError('')
    try {
      const res = await fetch('/api/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Portal not available')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: BG_DEEP,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{
        position: 'fixed',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '400px',
        background: 'radial-gradient(ellipse, rgba(34,211,238,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '22px', fontWeight: '800', color: CYAN }}>MaxTradeAI</span>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: TEXT_PRIMARY, marginTop: '20px', marginBottom: '8px' }}>
            Activate Your Account
          </h1>
          <p style={{ color: TEXT_MUTED, fontSize: '14px' }}>
            Signed in as <strong style={{ color: TEXT_PRIMARY }}>{user?.email}</strong>
          </p>
        </div>

        {/* Pricing card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(34,211,238,0.2)',
          backdropFilter: 'blur(12px)',
          borderRadius: '20px',
          padding: '36px',
          boxShadow: '0 0 60px rgba(34,211,238,0.06)',
          marginBottom: '16px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div>
              <span style={{ fontSize: '48px', fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: '-2px' }}>
                $19.99
              </span>
              <span style={{ color: TEXT_MUTED, fontSize: '14px', marginLeft: '4px' }}>/month</span>
            </div>
            <p style={{ color: TEXT_MUTED, fontSize: '13px', marginTop: '6px' }}>
              Full access. Cancel anytime.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '28px' }}>
            {pricingFeatures.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: TEXT_PRIMARY }}>
                <span style={{ color: CYAN, fontWeight: '700', flexShrink: 0 }}>✓</span>
                {f}
              </div>
            ))}
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#fca5a5',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubscribe}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'rgba(34,211,238,0.5)' : CYAN,
              color: BG_DEEP,
              border: 'none',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '14px',
              borderRadius: '10px',
              fontFamily: 'inherit',
              transition: 'opacity 0.2s',
              boxShadow: '0 0 30px rgba(34,211,238,0.2)',
            }}
          >
            {loading ? 'Redirecting...' : 'Subscribe Now →'}
          </button>
        </div>

        {/* Portal link */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            style={{
              background: 'none',
              border: 'none',
              color: TEXT_MUTED,
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            {portalLoading ? 'Opening...' : 'Already subscribed? Manage billing'}
          </button>
        </div>

        {/* Sign out */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={signOut}
            style={{
              background: 'none',
              border: 'none',
              color: TEXT_MUTED,
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
