import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const CYAN = '#22d3ee'
const BG_DEEP = '#020617'
const TEXT_PRIMARY = '#f1f5f9'
const TEXT_MUTED = '#94a3b8'

export default function Auth({ mode }) {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreedToTos, setAgreedToTos] = useState(false)

  const isLogin = mode === 'login'

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '12px 14px',
    color: TEXT_PRIMARY,
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await signIn(email, password)
        navigate('/workspace')
      } else {
        if (!agreedToTos) {
          setError('Please agree to the Terms of Service to continue.')
          setLoading(false)
          return
        }
        await signUp(email, password, fullName)
        navigate('/workspace')
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
      background: BG_DEEP,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Glow */}
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

      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '40px',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '22px', fontWeight: '800', color: CYAN, letterSpacing: '-0.5px' }}>
              MaxTradeAI
            </span>
          </Link>
          <p style={{ color: TEXT_MUTED, fontSize: '13px', marginTop: '8px' }}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: TEXT_MUTED, marginBottom: '6px', letterSpacing: '0.04em' }}>
                FULL NAME
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your name"
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = CYAN}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: TEXT_MUTED, marginBottom: '6px', letterSpacing: '0.04em' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = CYAN}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: TEXT_MUTED, marginBottom: '6px', letterSpacing: '0.04em' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = CYAN}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
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
              <label htmlFor="tos" style={{ fontSize: '12px', color: TEXT_MUTED, lineHeight: '1.5', cursor: 'pointer' }}>
                I agree to the{' '}
                <a href="/terms" style={{ color: CYAN, textDecoration: 'none' }}>Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" style={{ color: CYAN, textDecoration: 'none' }}>Privacy Policy</a>
              </label>
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#fca5a5',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (!isLogin && !agreedToTos)}
            style={{
              width: '100%',
              background: (loading || (!isLogin && !agreedToTos)) ? 'rgba(34,211,238,0.5)' : CYAN,
              color: '#020617',
              border: 'none',
              fontSize: '15px',
              fontWeight: '700',
              cursor: (loading || (!isLogin && !agreedToTos)) ? 'not-allowed' : 'pointer',
              padding: '13px',
              borderRadius: '8px',
              marginTop: '4px',
              transition: 'opacity 0.2s',
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Log in' : 'Create account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: TEXT_MUTED }}>
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: CYAN, textDecoration: 'none', fontWeight: '600' }}>
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link to="/login" style={{ color: CYAN, textDecoration: 'none', fontWeight: '600' }}>
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
