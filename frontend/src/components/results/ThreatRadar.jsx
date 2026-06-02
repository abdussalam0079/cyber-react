import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const AXES = ['Malware', 'Phishing', 'SSL', 'Domain', 'Patterns', 'Reputation']

function polar(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function pointsToPath(pts) {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + ' Z'
}

export default function ThreatRadar({ scan }) {
  const svgRef = useRef(null)

  const ev = scan?.evidence || {}
  const rawValues = [
    ev.urlhaus?.listed ? 9 : ev.virustotal?.malicious > 0 ? 7 : 1,
    ev.phishtank?.phish ? 9.5 : ev.gsb?.flagged ? 8 : 1.5,
    ev.ssl?.expired ? 8 : ev.ssl?.expiringSoon ? 5 : ev.ssl?.valid ? 1 : 4,
    ev.domain?.ageDays != null ? (ev.domain.ageDays < 30 ? 9 : ev.domain.ageDays < 180 ? 5 : 1.5) : 3,
    (ev.patterns?.length || 0) > 3 ? 7 : (ev.patterns?.length || 0) > 0 ? 4 : 1,
    ev.urlscan?.malicious ? 8 : ev.virustotal?.malicious > 0 ? 6 : 2,
  ]

  const cx = 130, cy = 130, maxR = 100
  const n = AXES.length
  const step = 360 / n

  useEffect(() => {
    if (!svgRef.current) return

    // Animate radar fill path
    const fillEl = svgRef.current.querySelector('#radarFill')
    const strokeEl = svgRef.current.querySelector('#radarStroke')
    const dots = svgRef.current.querySelectorAll('.radar-dot')
    const scanLine = svgRef.current.querySelector('#scanLine')

    const finalPts = rawValues.map((v, i) => {
      const r = (v / 10) * maxR
      return polar(cx, cy, r, i * step)
    })
    const finalPath = pointsToPath(finalPts)

    const zeroPts = rawValues.map((_, i) => polar(cx, cy, 0, i * step))
    const zeroPath = pointsToPath(zeroPts)

    // Set to zero, then animate to real values
    gsap.set([fillEl, strokeEl], { attr: { d: zeroPath } })
    gsap.to([fillEl, strokeEl], {
      duration: 1.4,
      ease: 'power3.out',
      attr: { d: finalPath },
      delay: 0.3,
    })

    // Animate dots
    dots.forEach((dot, i) => {
      const r = (rawValues[i] / 10) * maxR
      const pt = polar(cx, cy, r, i * step)
      gsap.fromTo(dot,
        { attr: { cx: cx, cy: cy, r: 0 }, opacity: 0 },
        { attr: { cx: pt.x, cy: pt.y, r: 3.5 }, opacity: 1, duration: 0.8, delay: 0.5 + i * 0.08, ease: 'back.out(2)' }
      )
    })

    // Rotating scan line
    gsap.to(scanLine, {
      rotation: 360,
      transformOrigin: `${cx}px ${cy}px`,
      duration: 4,
      ease: 'none',
      repeat: -1,
    })

    return () => {
      gsap.killTweensOf([fillEl, strokeEl, scanLine])
      dots.forEach(d => gsap.killTweensOf(d))
    }
  }, [scan])

  const gridRings = [0.25, 0.5, 0.75, 1]

  return (
    <svg ref={svgRef} viewBox="0 0 260 260" style={{ width: '100%', maxWidth: 260, overflow: 'visible' }}>
      <defs>
        <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
        </radialGradient>
        <radialGradient id="radarGradLight" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.03" />
        </radialGradient>
        <linearGradient id="scanGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#6366f1" stopOpacity="0" />
          <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Grid rings */}
      {gridRings.map((t, i) => {
        const pts = Array.from({ length: n }, (_, j) => polar(cx, cy, t * maxR, j * step))
        return (
          <path
            key={i}
            d={pointsToPath(pts)}
            fill="none"
            stroke="rgba(99,102,241,0.12)"
            strokeWidth="1"
          />
        )
      })}

      {/* Axis lines */}
      {AXES.map((_, i) => {
        const pt = polar(cx, cy, maxR, i * step)
        return <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="rgba(99,102,241,0.12)" strokeWidth="1" />
      })}

      {/* Scan sweep line */}
      <line id="scanLine" x1={cx} y1={cy} x2={cx} y2={cy - maxR} stroke="url(#scanGrad)" strokeWidth="1.5" opacity="0.7" />

      {/* Radar fill */}
      <path id="radarFill" d={pointsToPath(rawValues.map((_, i) => polar(cx, cy, 0, i * step)))} fill="url(#radarGrad)" opacity="0.85" />
      <path id="radarStroke" d={pointsToPath(rawValues.map((_, i) => polar(cx, cy, 0, i * step)))} fill="none" stroke="#6366f1" strokeWidth="1.5" opacity="0.9" />

      {/* Dots */}
      {rawValues.map((_, i) => (
        <circle key={i} className="radar-dot" cx={cx} cy={cy} r={0} fill="#a5b4fc" />
      ))}

      {/* Labels */}
      {AXES.map((label, i) => {
        const labelPt = polar(cx, cy, maxR + 18, i * step)
        const anchor = labelPt.x < cx - 5 ? 'end' : labelPt.x > cx + 5 ? 'start' : 'middle'
        return (
          <text
            key={label}
            x={labelPt.x}
            y={labelPt.y + 4}
            textAnchor={anchor}
            fontSize="9"
            fontFamily="var(--font-mono, monospace)"
            fontWeight="700"
            fill="rgba(148,163,184,0.8)"
            letterSpacing="0.08em"
          >
            {label.toUpperCase()}
          </text>
        )
      })}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3} fill="#6366f1" opacity="0.6" />
    </svg>
  )
}
