import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getTrip, getPlaces, addPlace, deleteTrip, getShareLink, assignPlaceToDate, unassignPlace } from '../lib/trips'
import { deleteDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import PlaceCard from '../components/PlaceCard'
import AddPlaceForm from '../components/AddPlaceForm'
import BottomNav from '../components/BottomNav'
import BottomSheet from '../components/BottomSheet'

function parseLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getDaysInRange(startIso, endIso) {
  const start = parseLocalDate(startIso)
  const end = endIso ? parseLocalDate(endIso) : start
  const days = []
  const cur = new Date(start)
  while (cur <= end) {
    const y = cur.getFullYear()
    const mo = String(cur.getMonth() + 1).padStart(2, '0')
    const d = String(cur.getDate()).padStart(2, '0')
    days.push({
      iso: `${y}-${mo}-${d}`,
      label: cur.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      dayNum: days.length + 1,
    })
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

function PlanCard({ place, onUnassign }) {
  return (
    <div style={{
      background: '#1A2535',
      border: '1px solid #243347',
      borderRadius: '8px',
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          fontWeight: 500,
          color: '#F6F1E9',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: '4px',
        }}>
          {place.name}
        </p>
        <a
          href={place.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#A09383', letterSpacing: '0.06em', textDecoration: 'none' }}
        >
          MAPS →
        </a>
      </div>
      {onUnassign && (
        <button
          onClick={onUnassign}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#546A87', fontSize: '18px', lineHeight: 1, flexShrink: 0, padding: '0 2px' }}
          onMouseEnter={e => e.currentTarget.style.color = '#A09383'}
          onMouseLeave={e => e.currentTarget.style.color = '#546A87'}
        >
          ×
        </button>
      )}
    </div>
  )
}

function PlacePicker({ dayLabel, unplanned, onSelect, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,22,32,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '100%',
        background: '#182030',
        borderTop: '1px solid #243347',
        borderRadius: '16px 16px 0 0',
        padding: '20px 24px 48px',
        maxHeight: '65vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', color: '#546A87' }}>ADD TO</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600, color: '#F6F1E9', marginTop: '2px' }}>{dayLabel}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#546A87', fontSize: '24px', lineHeight: 1 }}>×</button>
        </div>

        {unplanned.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#546A87', textAlign: 'center', padding: '24px 0' }}>
            All places are already planned
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {unplanned.map(p => (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                style={{
                  width: '100%',
                  background: '#1A2535',
                  border: '1px solid #243347',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'border-color 120ms ease',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#A09383'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#243347'}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#F6F1E9', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', color: '#546A87', flexShrink: 0 }}>
                  ADD →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TripPage() {
  const { tripId } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [places, setPlaces] = useState([])
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [activeTab, setActiveTab] = useState('places')
  const [assigningFor, setAssigningFor] = useState(null)

  useEffect(() => {
    getTrip(tripId)
      .then(t => {
        if (!t) { setError('Trip not found.'); return }
        if (!t.allowedUsers.includes(currentUser.uid)) { setError("You don't have access to this trip."); return }
        setTrip(t)
      })
      .catch(() => setError("You don't have access to this trip."))
  }, [tripId, currentUser.uid])

  useEffect(() => {
    if (!trip) return
    return getPlaces(tripId, setPlaces)
  }, [trip, tripId])

  async function handleAddPlace(name, mapsUrl, tag) {
    await addPlace(tripId, currentUser, name, mapsUrl, tag)
    setShowAddForm(false)
  }

  async function handleDeletePlace(placeId) {
    await deleteDoc(doc(db, 'trips', tripId, 'places', placeId))
  }

  async function handleDeleteTrip() {
    navigate('/')
    deleteTrip(tripId, trip.shareToken).catch(console.error)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(getShareLink(trip.shareToken))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#182030', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="ticket" style={{ maxWidth: '340px', width: '100%' }}>
          <div className="ticket-stub">
            <div className="ticket-hole" /><div className="ticket-hole" /><div className="ticket-hole" />
          </div>
          <div className="ticket-body" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '18px', color: '#1A1714', marginBottom: '8px' }}>Access denied</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#546A87', marginBottom: '16px' }}>{error}</p>
            <Link to="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#A09383', textDecoration: 'none', letterSpacing: '0.08em' }}>← BACK HOME</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div style={{ minHeight: '100vh', background: '#182030', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  const isOwner = trip.ownerId === currentUser.uid
  const TABS = [
    { id: 'places', label: 'PLACES' },
    { id: 'plan',   label: 'PLAN'   },
    { id: 'people', label: 'PEOPLE' },
  ]

  const days = trip.startDate ? getDaysInRange(trip.startDate, trip.endDate) : []
  const colWidth = days.length <= 1 ? '100%' : days.length === 2 ? '82%' : '74%'
  const unplanned = places.filter(p => !p.plannedDate)

  const contribMap = {}
  places.forEach(p => {
    if (!contribMap[p.addedBy]) {
      contribMap[p.addedBy] = { uid: p.addedBy, name: p.addedByName || p.addedByEmail, count: 0 }
    }
    contribMap[p.addedBy].count++
  })
  const contributors = Object.values(contribMap).sort((a, b) => b.count - a.count)

  const FAB_BOTTOM = 'calc(72px + env(safe-area-inset-bottom) + 16px)'

  return (
    <div style={{ minHeight: '100vh', background: '#182030', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '56px 24px 0', borderBottom: '1px solid #1E2A3E' }}>
        <Link to="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', color: '#546A87', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>
          ← ALL TRIPS
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '32px', color: '#F6F1E9', letterSpacing: '-0.02em', lineHeight: 1.1, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {trip.name}
          </h1>
          {isOwner && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.12em', color: '#A09383', border: '1px solid #A09383', padding: '2px 6px', borderRadius: '2px', flexShrink: 0 }}>
              OWNER
            </span>
          )}
          {/* Share button */}
          <button
            onClick={copyLink}
            title={copied ? 'Copied!' : 'Copy invite link'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: copied ? '#A09383' : '#546A87',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              padding: '4px',
              transition: 'color 150ms ease',
            }}
          >
            {copied ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
              </svg>
            )}
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #A09383' : '2px solid transparent',
                cursor: 'pointer',
                padding: '10px 0',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.14em',
                color: activeTab === tab.id ? '#F6F1E9' : '#546A87',
                transition: 'color 150ms ease, border-color 150ms ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, padding: '20px 24px 96px' }}>

        {/* ── PLACES ─────────────────────────────────────── */}
        {activeTab === 'places' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', color: '#546A87' }}>PLACES</p>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#546A87', background: '#0F1620', padding: '1px 8px', borderRadius: '20px', border: '1px solid #1E2A3E' }}>{places.length}</span>
              </div>
              {places.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: '#546A87' }}>No places yet</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#546A87', marginTop: '6px' }}>Tap + to add your first destination</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {places.map(place => (
                    <PlaceCard key={place.id} place={place} currentUid={currentUser.uid} onDelete={handleDeletePlace} />
                  ))}
                </div>
              )}
            </div>
            {isOwner && (
              <div style={{ paddingTop: '8px' }}>
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
                      Delete this trip
                    </span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#546A87' }}>Sure?</span>
                    <button
                      onClick={handleDeleteTrip}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', color: '#F6F1E9', background: '#A09383', padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                    >
                      DELETE
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#546A87', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PLAN ───────────────────────────────────────── */}
        {activeTab === 'plan' && (
          !trip.startDate ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: '8px' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: '#546A87' }}>No dates set</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#546A87' }}>Add travel dates to use the planner</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', marginRight: '-24px', paddingRight: '24px', paddingBottom: '4px' }}>
                {days.map(day => {
                  const dayPlaces = places.filter(p => p.plannedDate === day.iso)
                  return (
                    <div key={day.iso} style={{ flexShrink: 0, width: colWidth }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.14em', color: '#546A87' }}>DAY {day.dayNum}</p>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#F6F1E9', marginTop: '2px' }}>{day.label}</p>
                        </div>
                        <button
                          onClick={() => setAssigningFor(day)}
                          style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#A09383', background: 'none', border: '1px solid #243347', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', letterSpacing: '0.06em', flexShrink: 0 }}
                        >
                          + Add
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {dayPlaces.length === 0 ? (
                          <div style={{ background: '#0F1620', border: '1px dashed #243347', borderRadius: '8px', padding: '24px 12px', textAlign: 'center' }}>
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#546A87' }}>Nothing planned</p>
                          </div>
                        ) : (
                          dayPlaces.map(p => (
                            <PlanCard key={p.id} place={p} onUnassign={() => unassignPlace(tripId, p.id)} />
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {unplanned.length > 0 && (
                <div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', color: '#546A87', marginBottom: '10px' }}>
                    UNPLANNED · {unplanned.length}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {unplanned.map(p => (
                      <PlanCard key={p.id} place={p} onUnassign={null} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* ── PEOPLE ─────────────────────────────────────── */}
        {activeTab === 'people' && (
          contributors.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: '8px' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: '#546A87' }}>No contributors yet</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#546A87' }}>Add places to see who's contributed</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {contributors.map(c => (
                <div key={c.uid} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1E2A3E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #243347' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600, color: '#F6F1E9' }}>
                      {c.name[0].toUpperCase()}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 500, color: '#F6F1E9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#546A87', marginTop: '3px', letterSpacing: '0.04em' }}>
                      {c.count} {c.count === 1 ? 'place' : 'places'} added
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <BottomNav />

      {/* Floating FAB — Places tab only */}
      {activeTab === 'places' && (
        <button
          onClick={() => setShowAddForm(v => !v)}
          style={{
            position: 'fixed',
            bottom: FAB_BOTTOM,
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
      )}

      <BottomSheet open={showAddForm} onClose={() => setShowAddForm(false)}>
        <AddPlaceForm onAdd={handleAddPlace} />
      </BottomSheet>

      {/* Place picker overlay */}
      {assigningFor && (
        <PlacePicker
          dayLabel={assigningFor.label}
          unplanned={unplanned}
          onSelect={async (placeId) => {
            await assignPlaceToDate(tripId, placeId, assigningFor.iso)
            setAssigningFor(null)
          }}
          onClose={() => setAssigningFor(null)}
        />
      )}
    </div>
  )
}
