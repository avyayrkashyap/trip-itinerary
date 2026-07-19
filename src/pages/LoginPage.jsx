import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { currentUser, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  useEffect(() => {
    if (currentUser) navigate(redirect, { replace: true })
  }, [currentUser, navigate, redirect])

  async function handleSignIn() {
    try { await signInWithGoogle() } catch (err) { console.error(err) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#182030', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '340px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', color: '#546A87', marginBottom: '12px' }}>
            — TRAVEL TOGETHER —
          </p>
          <h1 style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: '48px',
            color: '#F6F1E9',
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}>
            Trip<br />Planner
          </h1>
        </div>

        <div className="ticket">
          <div className="ticket-stub">
            <div className="ticket-hole" />
            <div className="ticket-hole" />
            <div className="ticket-hole" />
          </div>
          <div className="ticket-body">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', color: '#546A87', marginBottom: '14px' }}>
              SIGN IN TO CONTINUE
            </p>
            <button
              onClick={handleSignIn}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                background: '#EDE7DC',
                border: '1px solid #CEC7B8',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <svg style={{ flexShrink: 0 }} width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: '14px', color: '#1A1714' }}>
                Continue with Google
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
