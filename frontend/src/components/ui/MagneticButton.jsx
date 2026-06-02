import { useRef } from 'react'
import { gsap } from 'gsap'

export default function MagneticButton({ children, className, onClick, disabled, style }) {
  const btnRef = useRef(null)
  const innerRef = useRef(null)

  const onMouseMove = (e) => {
    if (disabled) return
    const btn = btnRef.current
    const rect = btn.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    gsap.to(btn, { x: dx * 0.32, y: dy * 0.32, duration: 0.4, ease: 'power2.out' })
    gsap.to(innerRef.current, { x: dx * 0.14, y: dy * 0.14, duration: 0.4, ease: 'power2.out' })
  }

  const onMouseLeave = () => {
    gsap.to(btnRef.current, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' })
    gsap.to(innerRef.current, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' })
  }

  const onMouseDown = () => {
    gsap.to(btnRef.current, { scale: 0.94, duration: 0.12, ease: 'power2.in' })
  }

  const onMouseUp = () => {
    gsap.to(btnRef.current, { scale: 1, duration: 0.4, ease: 'elastic.out(1,0.4)' })
  }

  return (
    <button
      ref={btnRef}
      className={className}
      onClick={onClick}
      disabled={disabled}
      style={{ ...style, display: 'inline-flex', willChange: 'transform' }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      <span ref={innerRef} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', willChange: 'transform' }}>
        {children}
      </span>
    </button>
  )
}
