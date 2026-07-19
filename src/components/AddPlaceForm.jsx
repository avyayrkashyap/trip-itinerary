import { useState, useRef, useEffect } from 'react'
import { resolveNameFromUrl } from '../lib/urlUtils'

const MAPS_REGEX = /^https?:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|goo\.gl\/maps|maps\.app\.goo\.gl)\//

const TAGS = [
  { value: 'food', label: 'Food & Drink' },
  { value: 'place', label: 'Places to Visit' },
]

export default function AddPlaceForm({ onAdd }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [tag, setTag] = useState(null)
  const [urlError, setUrlError] = useState('')
  const [resolving, setResolving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const nameManuallyEdited = useRef(false)
  const debounceTimer = useRef(null)

  function validateUrl(val) {
    if (!val) { setUrlError(''); return }
    setUrlError(MAPS_REGEX.test(val) ? '' : 'Paste a Google Maps link')
  }

  function handleNameChange(e) {
    nameManuallyEdited.current = e.target.value.length > 0
    setName(e.target.value)
  }

  function handleUrlChange(e) {
    const val = e.target.value
    setUrl(val)
    validateUrl(val)

    clearTimeout(debounceTimer.current)
    if (!MAPS_REGEX.test(val)) return

    debounceTimer.current = setTimeout(async () => {
      if (nameManuallyEdited.current) return
      setResolving(true)
      try {
        const { expandedUrl, name: extracted } = await resolveNameFromUrl(val)
        if (!nameManuallyEdited.current && extracted) {
          setName(extracted)
          setUrl(expandedUrl)
        }
      } catch {
        // silently ignore — user fills name manually
      } finally {
        setResolving(false)
      }
    }, 300)
  }

  useEffect(() => () => clearTimeout(debounceTimer.current), [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!url.trim() || urlError || resolving) return
    setSubmitting(true)
    try {
      await onAdd(name.trim() || 'Place', url.trim(), tag)
      setName('')
      setUrl('')
      setTag(null)
      nameManuallyEdited.current = false
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = submitting || resolving || !url.trim() || !!urlError

  const inputStyle = {
    fontFamily: 'var(--font-mono)',
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
    <form onSubmit={handleSubmit} style={{ padding: '16px 24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '22px', color: '#F6F1E9', letterSpacing: '-0.01em' }}>
        New Place
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', color: '#546A87' }}>MAPS LINK</label>
        <input
          autoFocus
          type="url"
          value={url}
          onChange={handleUrlChange}
          placeholder="maps.google.com/…"
          style={{ ...inputStyle, borderColor: urlError ? '#A09383' : '#243347' }}
          required
        />
        {urlError && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#A09383', letterSpacing: '0.04em' }}>
            {urlError}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', color: '#546A87' }}>TAG</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {TAGS.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTag(tag === t.value ? null : t.value)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.06em',
                padding: '8px 14px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: tag === t.value ? '#A09383' : '#243347',
                background: tag === t.value ? '#A09383' : 'transparent',
                color: tag === t.value ? '#182030' : '#546A87',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', color: '#546A87' }}>
          PLACE NAME
          {resolving && <span style={{ marginLeft: '8px', color: '#546A87', fontStyle: 'italic' }}>resolving…</span>}
        </label>
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder={resolving ? 'Resolving…' : 'e.g. Central Park'}
          style={{ ...inputStyle, opacity: resolving ? 0.5 : 1 }}
        />
      </div>

      <button
        type="submit"
        disabled={disabled}
        style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          fontSize: '15px',
          color: '#F6F1E9',
          background: disabled ? '#2A3A50' : '#A09383',
          padding: '16px',
          borderRadius: '12px',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background 150ms ease',
          letterSpacing: '0.01em',
        }}
      >
        {submitting ? 'Adding…' : 'Add place'}
      </button>
    </form>
  )
}
