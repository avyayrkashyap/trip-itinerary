import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getUserStats, deleteAccount } from '../lib/trips'
import BottomNav from '../components/BottomNav'

export default function ProfilePage() {
  const { currentUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    getUserStats(currentUser.uid, currentUser.email).then(setStats)
  }, [currentUser.uid, currentUser.email])

  const displayName = currentUser.displayName || currentUser.email
  const initial = displayName[0].toUpperCase()

  const joinedDate = currentUser.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteAccount(currentUser)
      navigate('/login')
    } catch (err) {
      console.error('deleteAccount error:', err.code, err.message, err)
      if (err.code === 'auth/requires-recent-login') {
        setDeleteError('Please sign out and sign back in, then try again.')
      } else {
        setDeleteError(err.message || 'Something went wrong. Try again.')
      }
      setDeleting(false)
    }
  }

  const statBox = (value, label) => (
    <div style={{
      flex: 1,
      background: '#1A2535',
      border: '1px solid #243347',
      borderRadius: '12px',
      padding: '18px 16px',
      textAlign: 'center',
    }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 700, color: '#F6F1E9', lineHeight: 1 }}>
        {value ?? '—'}
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.14em', color: '#546A87', marginTop: '6px' }}>
        {label}
      </p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#182030', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, padding: '64px 24px 96px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* Avatar + identity */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', paddingTop: '8px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: '#1E2A3E',
            border: '1px solid #243347',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 700, color: '#F6F1E9' }}>
              {initial}
            </span>
          </div>
          <div style={{ textAlign: 'center' }}>
            {currentUser.displayName && (
              <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '22px', color: '#F6F1E9', letterSpacing: '-0.01em' }}>
                {currentUser.displayName}
              </p>
            )}
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#546A87', marginTop: '4px' }}>
              {currentUser.email}
            </p>
            {joinedDate && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: '#546A87', marginTop: '6px' }}>
                MEMBER SINCE {joinedDate.toUpperCase()}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {statBox(stats?.total, 'TRIPS')}
          {statBox(stats?.owned, 'OWNED')}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
          <button
            onClick={handleSignOut}
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              fontSize: '14px',
              letterSpacing: '0.04em',
              color: '#F6F1E9',
              background: '#1A2535',
              border: '1px solid #243347',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>

        {/* Delete account */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #1E2A3E' }}>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#A09383">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#A09383', letterSpacing: '0.06em' }}>
                Delete account
              </span>
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#546A87', lineHeight: 1.5 }}>
                This deletes all your trips and removes you from shared trips. This cannot be undone.
              </p>
              {deleteError && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#A09383' }}>{deleteError}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    color: '#F6F1E9',
                    background: '#A09383',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    opacity: deleting ? 0.6 : 1,
                  }}
                >
                  {deleting ? 'Deleting…' : 'DELETE'}
                </button>
                <button
                  onClick={() => { setConfirmDelete(false); setDeleteError('') }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#546A87', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
