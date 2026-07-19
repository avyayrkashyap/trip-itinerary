import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { joinTripByToken } from '../lib/trips'

export default function JoinPage() {
  const { shareToken } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    joinTripByToken(shareToken, currentUser)
      .then(tripId => navigate(`/trips/${tripId}`, { replace: true }))
      .catch(err => setError(err.message || 'Invalid or expired link.'))
  }, [shareToken, currentUser, navigate])

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#182030', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="ticket" style={{ maxWidth: '340px', width: '100%' }}>
          <div className="ticket-stub">
            <div className="ticket-hole" /><div className="ticket-hole" /><div className="ticket-hole" />
          </div>
          <div className="ticket-body" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '18px', color: '#1A1714', marginBottom: '8px' }}>Link invalid</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#546A87', marginBottom: '16px' }}>{error}</p>
            <Link to="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#A09383', textDecoration: 'none', letterSpacing: '0.08em' }}>← BACK HOME</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#182030', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.12em', color: '#546A87' }}>JOINING TRIP…</p>
      </div>
    </div>
  )
}
