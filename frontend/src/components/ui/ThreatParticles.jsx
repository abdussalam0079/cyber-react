import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function ThreatParticles({ score = 0, active = true }) {
  const canvasRef = useRef(null)
  const stateRef  = useRef({ mouse: { x: -9999, y: -9999 }, burst: false })
  const rafRef    = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = canvas.width  = window.innerWidth
    let H = canvas.height = window.innerHeight
    const isDark = () => document.documentElement.dataset.theme !== 'light'

    const onResize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    const onMove = (e) => {
      stateRef.current.mouse = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMove)

    /* ── Particles ── */
    const COUNT = active ? Math.max(28, Math.floor(score * 6)) : 18
    const particles = Array.from({ length: COUNT }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      ox:    0, oy: 0,          // original pos offset
      vx:    (Math.random() - 0.5) * 0.35,
      vy:    (Math.random() - 0.5) * 0.35,
      r:     Math.random() * 2.2 + 0.6,
      alpha: Math.random() * 0.45 + 0.15,
      hue:   Math.random() > 0.5 ? 240 : 260, // indigo / violet
      pulse: Math.random() * Math.PI * 2,       // phase offset
    }))

    /* GSAP fade-in per particle */
    const proxy = { t: 0 }
    gsap.to(proxy, {
      t: 1, duration: 1.6, ease: 'power2.inOut',
      onUpdate() { particles.forEach(p => { p.alpha = p.alpha * proxy.t }) }
    })

    /* ── Draw loop ── */
    function draw() {
      ctx.clearRect(0, 0, W, H)
      const dark = isDark()
      const mx = stateRef.current.mouse.x
      const my = stateRef.current.mouse.y
      const now = performance.now() * 0.001

      /* connection lines first */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < 140) {
            const alpha = (1 - d / 140) * (dark ? 0.08 : 0.10)
            ctx.beginPath()
            ctx.strokeStyle = dark
              ? `rgba(99,102,241,${alpha})`
              : `rgba(124,58,237,${alpha})`
            ctx.lineWidth = 0.7
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      /* particles */
      particles.forEach(p => {
        /* mouse repulsion */
        const dxm = p.x - mx
        const dym = p.y - my
        const dm  = Math.sqrt(dxm * dxm + dym * dym)
        if (dm < 120) {
          const force = (120 - dm) / 120 * 1.5
          p.vx += (dxm / dm) * force * 0.08
          p.vy += (dym / dm) * force * 0.08
        }

        /* friction */
        p.vx *= 0.985
        p.vy *= 0.985

        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H
        if (p.y > H) p.y = 0

        /* pulsing alpha */
        p.pulse += 0.016
        const pAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse))

        /* draw dot */
        const hue = dark ? p.hue : p.hue - 20
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${hue},80%,${dark ? 70 : 50}%,${pAlpha})`
        ctx.fill()

        /* glow */
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${hue},80%,${dark ? 70 : 50}%,${pAlpha * 0.15})`
        ctx.fill()
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [score, active])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.65,
      }}
    />
  )
}
