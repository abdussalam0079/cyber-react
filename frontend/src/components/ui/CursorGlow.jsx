import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function CursorGlow() {
  const ringRef    = useRef(null)
  const dotRef     = useRef(null)
  const glowRef    = useRef(null)
  const tl1Ref     = useRef(null)

  useEffect(() => {
    const ring = ringRef.current
    const dot  = dotRef.current
    const glow = glowRef.current
    if (!ring || !dot || !glow) return

    let raf
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const lag = { x: pos.x, y: pos.y }

    const onMove = (e) => {
      pos.x = e.clientX
      pos.y = e.clientY

      /* dot snaps instantly */
      gsap.to(dot, { x: e.clientX - 4, y: e.clientY - 4, duration: 0.06, ease: 'none' })

      /* ambient glow follows slowly */
      gsap.to(glow, { x: e.clientX - 180, y: e.clientY - 180, duration: 0.8, ease: 'power2.out' })
    }

    /* ring lags behind with rubber-band */
    function loop() {
      lag.x += (pos.x - lag.x) * 0.12
      lag.y += (pos.y - lag.y) * 0.12
      gsap.set(ring, { x: lag.x - 20, y: lag.y - 20 })
      raf = requestAnimationFrame(loop)
    }
    loop()

    /* click burst */
    const onClick = () => {
      gsap.timeline()
        .to(ring, { scale: 2.2, opacity: 0, duration: 0.45, ease: 'power2.out' })
        .to(ring, { scale: 1,   opacity: 1, duration: 0,    ease: 'none' })
    }

    /* hover interactive elements */
    const onEnter = () => {
      gsap.to(ring, { scale: 1.8, borderColor: 'rgba(0,229,255,0.8)', duration: 0.3 })
    }
    const onLeave = () => {
      gsap.to(ring, { scale: 1, borderColor: 'rgba(99,102,241,0.6)', duration: 0.3 })
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('click', onClick)
    document.querySelectorAll('button,a,input,[role="button"]').forEach(el => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <>
      {/* Ambient radial glow */}
      <div ref={glowRef} style={{
        position: 'fixed', top: 0, left: 0,
        width: 360, height: 360,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.055) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 9997,
        willChange: 'transform',
      }} />

      {/* Sci-fi ring cursor */}
      <div ref={ringRef} style={{
        position: 'fixed', top: 0, left: 0,
        width: 40, height: 40,
        borderRadius: '50%',
        border: '1.5px solid rgba(99,102,241,0.6)',
        pointerEvents: 'none',
        zIndex: 9999,
        willChange: 'transform',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Corner brackets */}
        {[
          { top: -1, left: -1,   borderTop: '2px solid #6366f1', borderLeft: '2px solid #6366f1',  width: 7, height: 7 },
          { top: -1, right: -1,  borderTop: '2px solid #6366f1', borderRight: '2px solid #6366f1', width: 7, height: 7 },
          { bottom: -1, left: -1,  borderBottom: '2px solid #6366f1', borderLeft: '2px solid #6366f1',  width: 7, height: 7 },
          { bottom: -1, right: -1, borderBottom: '2px solid #6366f1', borderRight: '2px solid #6366f1', width: 7, height: 7 },
        ].map((s, i) => (
          <div key={i} style={{ position: 'absolute', ...s }} />
        ))}
      </div>

      {/* Center dot */}
      <div ref={dotRef} style={{
        position: 'fixed', top: 0, left: 0,
        width: 8, height: 8,
        borderRadius: '50%',
        background: 'rgba(99,102,241,0.9)',
        boxShadow: '0 0 8px rgba(99,102,241,0.8)',
        pointerEvents: 'none',
        zIndex: 10000,
        willChange: 'transform',
      }} />
    </>
  )
}
