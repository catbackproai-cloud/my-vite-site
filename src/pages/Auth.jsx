import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const CYAN = '#22d3ee'
const BG = '#020617'
const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#64748b'
const BORDER = 'rgba(255,255,255,0.08)'

export default function Auth({ mode }) {
  const navigate = useNavigate()
  const { signIn, signUp, user, profile, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading || !user) return
    if (profile?.subscription_status === 'active') {
      navigate('/workspace', { replace: true })
    } else if (profile) {
      navigate('/upgrade', { replace: true })
    }
  }, [user, profile, authLoading, navigate])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreedToTos, setAgreedToTos] = useState(false)

  const isLogin = mode === 'login'

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${BORDER}`,
    borderRadius: '8px',
    padding: '11px 14px',
    color: TEXT_PRIMARY,
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    fontFamily: 'inherit',
    letterSpacing: '-0.01em',
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        if (!agreedToTos) {
          setError('Please agree to the Terms of Service to continue.')
          setLoading(false)
          return
        }
        await signUp(email, password, fullName)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: BG,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}
      className="dot-grid"
    >
      {/* Glow */}
      <div style={{
        position: 'fixed',
        top: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '500px',
        height: '400px',
        background: 'radial-gradient(ellipse, rgba(34,211,238,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '380px',
        position: 'relative',
      }}
        className="fade-in"
      >
        {/* Card */}
        <div style={{
          background: 'rgba(6,15,30,0.95)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 24px 48px rgba(0,0,0,0.4)',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <span style={{
                fontSize: '20px',
                fontWeight: '700',
                color: CYAN,
                letterSpacing: '-0.5px',
              }}>
                MaxTradeAI
              </span>
            </Link>
            <p style={{
              color: TEXT_MUTED,
              fontSize: '13px',
              marginTop: '6px',
              letterSpacing: '-0.01em',
            }}>
              {isLogin ? 'Welcome back' : 'Create your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {!isLogin && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: TEXT_MUTED,
                  marginBottom: '6px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  Full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your name"
                  required
                  style={inputStyle}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(34,211,238,0.4)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.07)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = BORDER
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            )}

            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '500',
                color: TEXT_MUTED,
                marginBottom: '6px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={inputStyle}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(34,211,238,0.4)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.07)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = BORDER
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '500',
                color: TEXT_MUTED,
                marginBottom: '6px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                style={inputStyle}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(34,211,238,0.4)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.07)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = BORDER
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            {!isLogin && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="tos"
                  checked={agreedToTos}
                  onChange={e => setAgreedToTos(e.target.checked)}
                  style={{ marginTop: '2px', accentColor: CYAN, cursor: 'pointer', flexShrink: 0 }}
                />
                <label htmlFor="tos" style={{
                  fontSize: '12px',
                  color: TEXT_MUTED,
                  lineHeight: '1.5',
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                }}>
                  I agree to the{' '}
                  <Link to="/terms" style={{ color: CYAN, textDecoration: 'none' }}>Terms of Service</Link>
                </label>
              </div>
            )}

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '13px',
                color: '#fca5a5',
                letterSpacing: '-0.01em',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && !agreedToTos)}
              className="btn"
              style={{
                width: '100%',
                background: (loading || (!isLogin && !agreedToTos)) ? 'rgba(34,211,238,0.4)' : CYAN,
                color: '#020617',
                fontSize: '14px',
                fontWeight: '600',
                padding: '12px',
                borderRadius: '8px',
                marginTop: '4px',
                letterSpacing: '-0.01em',
                boxShadow: (loading || (!isLogin && !agreedToTos)) ? 'none' : '0 0 20px rgba(34,211,238,0.15)',
              }}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Log in' : 'Create account')}
            </button>
          </form>

          <div style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '13px',
            color: TEXT_MUTED,
            letterSpacing: '-0.01em',
          }}>
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <Link to="/signup" style={{ color: CYAN, textDecoration: 'none', fontWeight: '500' }}>
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" style={{ color: CYAN, textDecoration: 'none', fontWeight: '500' }}>
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
