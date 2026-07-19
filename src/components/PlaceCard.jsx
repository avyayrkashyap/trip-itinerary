export default function PlaceCard({ place, currentUid, onDelete }) {
  const date = place.createdAt?.toDate?.().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  }) ?? '—'
  const isOwner = place.addedBy === currentUid

  return (
    <div style={{
      background: '#1A2535',
      border: '1px solid #243347',
      borderRadius: '12px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '14px',
          fontWeight: 600,
          color: '#F6F1E9',
          letterSpacing: '-0.01em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: '6px',
        }}>
          {place.name}
        </p>
        <a
          href={place.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: '#A09383',
            letterSpacing: '0.06em',
            textDecoration: 'none',
            display: 'inline-block',
            marginBottom: '6px',
          }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          VIEW ON MAPS →
        </a>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#546A87' }}>
          {place.addedByName || place.addedByEmail} · {date}
        </p>
      </div>
      {isOwner && (
        <button
          onClick={() => onDelete(place.id)}
          title="Remove"
          style={{ color: '#546A87', fontSize: '20px', lineHeight: 1, cursor: 'pointer', background: 'none', border: 'none', flexShrink: 0, padding: '0 2px' }}
          onMouseEnter={e => e.currentTarget.style.color = '#A09383'}
          onMouseLeave={e => e.currentTarget.style.color = '#546A87'}
        >
          ×
        </button>
      )}
    </div>
  )
}
