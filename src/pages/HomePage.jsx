import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createTrip, getUserTrips } from '../lib/trips'
import TripCard from '../components/TripCard'
import BottomNav from '../components/BottomNav'
import BottomSheet from '../components/BottomSheet'

function parseLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function categorize(trip) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = trip.startDate ? parseLocalDate(trip.startDate) : null
  const end   = trip.endDate   ? parseLocalDate(trip.endDate)   : null

  if (!start && !end) return 'upcoming'
  if (end && end < today) return 'past'
  if (start && start > today) return 'upcoming'
  // start <= today and (end is today or later, or no end set for single-day trips)
  if (start && end && start <= today && end >= today) return 'ongoing'
  if (start && !end && start.getTime() === today.getTime()) return 'ongoing'
  if (start && !end && start < today) return 'past'
  return 'upcoming'
}

function Section({ label, trips, currentUid, onDelete, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  if (trips.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 0 12px',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.16em',
          color: '#546A87',
        }}>
          {label}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="#546A87"
          style={{ transition: 'transform 220ms ease', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', flexShrink: 0 }}
        >
          <path d="M2 4l4 4 4-4" stroke="#546A87" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div style={{
        overflow: 'hidden',
        maxHeight: open ? '2000px' : '0',
        transition: open ? 'max-height 350ms ease' : 'max-height 220ms ease',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '24px' }}>
          {trips.map(trip => (
            <TripCard key={trip.id} trip={trip} currentUid={currentUid} onDelete={onDelete} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [showSheet, setShowSheet] = useState(false)
  const [tripName, setTripName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    return getUserTrips(currentUser.uid, setTrips)
  }, [currentUser.uid])

  function closeSheet() {
    setShowSheet(false)
    setTripName('')
    setStartDate('')
    setEndDate('')
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!tripName.trim()) return
    setCreating(true)
    try {
      const tripId = await createTrip(currentUser, tripName.trim(), startDate || null, endDate || null)
      closeSheet()
      navigate(`/trips/${tripId}`)
    } catch (err) {
      console.error(err)
      setCreating(false)
    }
  }

  const ongoing  = trips.filter(t => categorize(t) === 'ongoing')
  const upcoming = trips.filter(t => categorize(t) === 'upcoming')
  const past     = trips.filter(t => categorize(t) === 'past')

  const inputStyle = {
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    fontSize: '15px',
    color: '#F6F1E9',
    background: '#0F1620',
    border: '1px solid #243347',
    borderRadius: '10px',
    padding: '13px 14px',
    outline: 'none',
    width: '100%',
    colorScheme: 'dark',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#182030', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '56px 24px 20px' }}>
        <h1 style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: '40px',
          color: '#F6F1E9',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          Trips
        </h1>
      </div>

      <div style={{ flex: 1, padding: '0 24px 96px' }}>
        {trips.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '8px' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', color: '#546A87' }}>No trips yet</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#546A87', letterSpacing: '0.04em' }}>
              Create one or open a shared link
            </p>
          </div>
        ) : (
          <>
            <Section label="ONGOING"    trips={ongoing}  currentUid={currentUser.uid} onDelete={id => setTrips(prev => prev.filter(t => t.id !== id))} defaultOpen={true} />
            <Section label="UPCOMING"   trips={upcoming} currentUid={currentUser.uid} onDelete={id => setTrips(prev => prev.filter(t => t.id !== id))} defaultOpen={true} />
            <Section label="PAST TRIPS" trips={past}     currentUid={currentUser.uid} onDelete={id => setTrips(prev => prev.filter(t => t.id !== id))} defaultOpen={false} />
          </>
        )}
      </div>

      <BottomNav />

      <button
        onClick={() => setShowSheet(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(72px + env(safe-area-inset-bottom) + 16px)',
          right: '20px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: '#F6F1E9',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          zIndex: 99,
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#182030">
          <path d="M0 0h24v24H0z" fill="none"/>
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>

      <BottomSheet open={showSheet} onClose={closeSheet}>
        <form onSubmit={handleCreate} style={{ padding: '16px 24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '22px', color: '#F6F1E9', letterSpacing: '-0.01em' }}>
            New Trip
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', color: '#546A87' }}>PLACE NAME</label>
            <input
              autoFocus
              type="text"
              value={tripName}
              onChange={e => setTripName(e.target.value)}
              placeholder="e.g. Tokyo"
              style={inputStyle}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', color: '#546A87' }}>FROM</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...inputStyle, fontSize: '14px' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', color: '#546A87' }}>TO</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate || undefined} style={{ ...inputStyle, fontSize: '14px' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating || !tripName.trim()}
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              fontSize: '15px',
              color: '#F6F1E9',
              background: creating || !tripName.trim() ? '#2A3A50' : '#A09383',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              cursor: creating || !tripName.trim() ? 'not-allowed' : 'pointer',
              transition: 'background 150ms ease',
              letterSpacing: '0.01em',
            }}
          >
            {creating ? 'Creating…' : 'Create trip'}
          </button>
        </form>
      </BottomSheet>
    </div>
  )
}
