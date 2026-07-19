import { useEffect, useState, useRef } from 'react'

export default function BottomSheet({ open, onClose, children }) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const sheetRef = useRef(null)
  const backdropRef = useRef(null)
  const dragState = useRef({ dragging: false, startY: 0, lastY: 0, velocity: 0 })

  useEffect(() => {
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 320)
      return () => clearTimeout(t)
    }
  }, [open])

  function onPointerDown(e) {
    const s = dragState.current
    s.dragging = true
    s.startY = e.clientY
    s.lastY = e.clientY
    s.velocity = 0
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e) {
    const s = dragState.current
    if (!s.dragging) return
    s.velocity = e.clientY - s.lastY
    s.lastY = e.clientY
    const dy = Math.max(0, e.clientY - s.startY)
    // Manipulate DOM directly — no setState, no re-render, smooth 60fps
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none'
      sheetRef.current.style.transform = `translateY(${dy}px)`
    }
    if (backdropRef.current) {
      backdropRef.current.style.transition = 'none'
      backdropRef.current.style.opacity = String(Math.max(0, 1 - dy / 260))
    }
  }

  function onPointerUp(e) {
    const s = dragState.current
    if (!s.dragging) return
    s.dragging = false
    const dy = Math.max(0, e.clientY - s.startY)
    const dismiss = dy > 120 || s.velocity > 10

    if (dismiss) {
      // Animate to fully off-screen then call onClose
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)'
        sheetRef.current.style.transform = 'translateY(100%)'
      }
      if (backdropRef.current) {
        backdropRef.current.style.transition = 'opacity 260ms ease'
        backdropRef.current.style.opacity = '0'
      }
      setTimeout(onClose, 260)
    } else {
      // Snap back
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 320ms cubic-bezier(0.32, 0.72, 0, 1)'
        sheetRef.current.style.transform = 'translateY(0)'
      }
      if (backdropRef.current) {
        backdropRef.current.style.transition = 'opacity 320ms ease'
        backdropRef.current.style.opacity = '1'
      }
    }
  }

  if (!mounted) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 300ms ease',
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: '#1A2535',
          borderRadius: '20px 20px 0 0',
          borderTop: '1px solid #243347',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 320ms cubic-bezier(0.32, 0.72, 0, 1)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Drag handle — pointer events attached here only */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '14px 0 8px',
            cursor: 'grab',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          <div style={{ width: '36px', height: '4px', background: '#2A3A50', borderRadius: '2px' }} />
        </div>

        {children}
      </div>
    </div>
  )
}
