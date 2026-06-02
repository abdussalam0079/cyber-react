import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'

export default function GlitchText({ text, className, style, tag: Tag = 'span', scramble = true }) {
  const ref = useRef(null)
  const tlRef = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (!scramble) {
      el.textContent = text
      return
    }

    // Initial scramble-in
    let frame = 0
    const totalFrames = 28
    const interval = setInterval(() => {
      frame++
      const progress = frame / totalFrames
      el.textContent = text.split('').map((char, i) => {
        if (char === ' ') return ' '
        if (i / text.length < progress) return char
        return CHARS[Math.floor(Math.random() * CHARS.length)]
      }).join('')
      if (frame >= totalFrames) {
        clearInterval(interval)
        el.textContent = text
        scheduleGlitch()
      }
    }, 40)

    function scheduleGlitch() {
      const delay = 4000 + Math.random() * 6000
      tlRef.current = gsap.delayedCall(delay / 1000, () => {
        let f = 0
        const glitchFrames = 10
        const glitchInterval = setInterval(() => {
          f++
          el.textContent = text.split('').map((char) => {
            if (char === ' ') return ' '
            return Math.random() > 0.7 ? CHARS[Math.floor(Math.random() * CHARS.length)] : char
          }).join('')
          if (f >= glitchFrames) {
            clearInterval(glitchInterval)
            el.textContent = text
            scheduleGlitch()
          }
        }, 45)
      })
    }

    return () => {
      clearInterval(interval)
      tlRef.current?.kill()
    }
  }, [text, scramble])

  return <Tag ref={ref} className={className} style={style}>{text}</Tag>
}
