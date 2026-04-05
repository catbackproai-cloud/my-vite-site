import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const CYAN = '#22d3ee'
const BG = '#020617'
const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#64748b'
const BORDER = 'rgba(255,255,255,0.08)'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: BG,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
    }} className="dot-grid">
      <div style={{ position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '400px', background: 'radial-gradient(ellipse, rgba(34,211,238,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '380px' }} className="fade-in">
        <div style={{
          background: 'rgba(6,15,30,0.95)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px', padding: '36px 32px',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 24px 48px rgba(0,0,0,0.4)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '20px', fontWeight: '700', color: CYAN, letterSpacing: '-0.5px' }}>MaxTradeAI</span>
            </Link>
            <p style={{ color: TEXT_MUTED, fontSize: '13px', marginTop: '6px' }}>
              {sent ? 'Check your email' : 'Reset your password'}
            </p>
          </div>

          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>📬</div>
              <p style={{ color: TEXT_MUTED, fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                We sent a reset link to <strong style={{ color: TEXT_PRIMARY }}>{email}</strong>. Check your inbox and follow the link to set a new password.
              </p>
              <Link to="/login" style={{ color: CYAN, fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>
                Back to log in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: TEXT_MUTED, marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${BORDER}`, borderRadius: '8px',
                    padding: '11px 14px', color: TEXT_PRIMARY, fontSize: '14px',
                    outline: 'none', fontFamily: 'inherit',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(34,211,238,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.07)' }}
                  onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#fca5a5' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn"
                style={{
                  width: '100%', background: loading ? 'rgba(34,211,238,0.4)' : CYAN,
                  color: '#020617', fontSize: '14px', fontWeight: '600',
                  padding: '12px', borderRadius: '8px', marginTop: '4px',
                  boxShadow: loading ? 'none' : '0 0 20px rgba(34,211,238,0.15)',
                }}
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>

              <div style={{ textAlign: 'center', fontSize: '13px', color: TEXT_MUTED }}>
                <Link to="/login" style={{ color: CYAN, textDecoration: 'none', fontWeight: '500' }}>
                  Back to log in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
