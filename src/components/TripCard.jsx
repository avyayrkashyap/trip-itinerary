import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getShareLink, deleteTrip } from '../lib/trips'

export default function TripCard({ trip, currentUid, onDelete }) {
  const isOwner = trip.ownerId === currentUid
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function onOutsideClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
        setConfirmDelete(false)
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [menuOpen])

  function fmtDate(iso) {
    if (!iso) return null
    const [y, m, d] = iso.split('-')
    return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const dateLabel = trip.startDate
    ? trip.endDate
      ? `${fmtDate(trip.startDate)} – ${fmtDate(trip.endDate)}`
      : `From ${fmtDate(trip.startDate)}`
    : (trip.createdAt?.toDate?.().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) ?? '—')

  async function handleShare(e) {
    e.preventDefault()
    e.stopPropagation()
    await navigator.clipboard.writeText(getShareLink(trip.shareToken))
    setCopied(true)
    setTimeout(() => { setCopied(false); setMenuOpen(false) }, 1500)
  }

  function handleDelete(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirmDelete) { setConfirmDelete(true); return }
    onDelete(trip.id)
    deleteTrip(trip.id, trip.shareToken).catch(console.error)
  }

  function toggleMenu(e) {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpen(v => !v)
    setConfirmDelete(false)
  }

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '10px 14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    letterSpacing: '0.04em',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ position: 'relative' }}>
      <Link
        to={`/trips/${trip.id}`}
        style={{
          display: 'block',
          background: '#1A2535',
          borderRadius: '12px',
          padding: '16px 18px',
          textDecoration: 'none',
          border: '1px solid #243347',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <h3 style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '18px',
              color: '#F6F1E9',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {trip.name}
            </h3>
            {isOwner && (
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                letterSpacing: '0.12em',
                color: '#A09383',
                border: '1px solid #A09383',
                padding: '2px 6px',
                borderRadius: '2px',
                flexShrink: 0,
              }}>
                OWNER
              </span>
            )}
          </div>

          {/* Kebab */}
          <button
            onClick={toggleMenu}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px',
              flexShrink: 0,
              color: '#546A87',
              lineHeight: 1,
              borderRadius: '4px',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#F6F1E9'}
            onMouseLeave={e => e.currentTarget.style.color = '#546A87'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.4"/>
              <circle cx="8" cy="8" r="1.4"/>
              <circle cx="8" cy="13" r="1.4"/>
            </svg>
          </button>
        </div>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#546A87' }}>
          {dateLabel} · {trip.allowedUsers.length} {trip.allowedUsers.length === 1 ? 'traveler' : 'travelers'}
        </p>
      </Link>

      {/* Dropdown */}
      {menuOpen && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: '#0F1620',
            border: '1px solid #243347',
            borderRadius: '10px',
            zIndex: 10,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            minWidth: '160px',
          }}
        >
          {/* Share */}
          <button
            onClick={handleShare}
            style={{ ...menuItemStyle, color: copied ? '#A09383' : '#F6F1E9' }}
            onMouseEnter={e => e.currentTarget.style.background = '#1A2535'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
            </svg>
            {copied ? 'Copied!' : 'Share link'}
          </button>

          {/* Divider */}
          <div style={{ height: '1px', background: '#1E2A3E' }} />

          {/* Delete (owner only) */}
          {isOwner && (
            confirmDelete ? (
              <div style={{ padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#546A87', flex: 1 }}>Sure?</span>
                <button
                  onClick={handleDelete}
                  style={{ ...menuItemStyle, padding: '4px 10px', background: '#A09383', color: '#F6F1E9', borderRadius: '6px', fontSize: '11px' }}
                >
                  Delete
                </button>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                style={{ ...menuItemStyle, color: '#A09383' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1A2535'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                Delete trip
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
