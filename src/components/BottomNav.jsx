import { useNavigate, useLocation } from 'react-router-dom'

function PlaneIcon({ active }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 0 24 24" width="22px" fill={active ? '#F6F1E9' : '#546A87'}>
      <path d="M0 0h24v24H0z" fill="none"/>
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
    </svg>
  )
}

function AccountIcon({ active }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 0 24 24" width="22px" fill={active ? '#F6F1E9' : '#546A87'}>
      <path d="M0 0h24v24H0z" fill="none"/>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  )
}

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const isTrips = location.pathname === '/'
  const isProfile = location.pathname === '/profile'

  const labelStyle = (active) => ({
    fontFamily: 'var(--font-mono)',
    fontSize: '9px',
    letterSpacing: '0.12em',
    color: active ? '#F6F1E9' : '#546A87',
    marginTop: '4px',
  })

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#0F1620',
      borderTop: '1px solid #1E2A3E',
      display: 'flex',
      alignItems: 'center',
      height: '72px',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100,
    }}>
      <button
        onClick={() => navigate('/')}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', paddingBottom: '4px' }}
      >
        <PlaneIcon active={isTrips} />
        <span style={labelStyle(isTrips)}>MY TRIPS</span>
      </button>

      <button
        onClick={() => navigate('/profile')}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', paddingBottom: '4px' }}
      >
        <AccountIcon active={isProfile} />
        <span style={labelStyle(isProfile)}>PROFILE</span>
      </button>
    </div>
  )
}
