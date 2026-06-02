import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import styles from './RiskGauge.module.css'

const SEV = (s) =>
  s >= 9 ? { label: 'CRITICAL', color: '#ff2255' } :
  s >= 7 ? { label: 'HIGH',     color: '#ff7700' } :
  s >= 4 ? { label: 'MEDIUM',   color: '#ffc800' } :
           { label: 'LOW',      color: '#00e5ff' }

export default function RiskGauge({ score }) {
  const fillRef   = useRef(null)
  const numRef    = useRef(null)
  const needleRef = useRef(null)
  const wrapRef   = useRef(null)
  const { label, color } = SEV(score)

  const totalArc   = 220
  const pct        = Math.min(score / 10, 1)
  const dashOffset = totalArc - pct * totalArc

  // Needle angle: 0 score = -90deg (left), 10 = +90deg (right)
  const needleAngle = -90 + pct * 180

  useEffect(() => {
    if (!fillRef.current || !numRef.current) return

    const tl = gsap.timeline({ delay: 0.3 })

    // Wrap entrance
    tl.fromTo(wrapRef.current,
      { opacity: 0, scale: 0.92 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.4)' }
    )

    // Arc stroke animation
    tl.fromTo(fillRef.current,
      { strokeDashoffset: totalArc },
      { strokeDashoffset: dashOffset, duration: 1.6, ease: 'power3.out' },
      '-=0.2'
    )

    // Needle sweep
    if (needleRef.current) {
      tl.fromTo(needleRef.current,
        { rotate: -90 },
        { rotate: needleAngle, duration: 1.6, ease: 'elastic.out(1, 0.6)', transformOrigin: '50% 100%' },
        '<'
      )
    }

    // Score counter
    const proxy = { val: 0 }
    tl.to(proxy, {
      val: score,
      duration: 1.4,
      ease: 'power3.out',
      onUpdate() {
        if (numRef.current) numRef.current.textContent = proxy.val.toFixed(1)
      },
    }, '<')

    return () => tl.kill()
  }, [score])

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <svg className={styles.svg} viewBox="0 0 200 115" overflow="visible">
        {/* Gradient def */}
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>

        {/* Background track */}
        <path
          d="M 15 95 A 85 85 0 0 1 185 95"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Colored zone segments */}
        {[
          { from: 0,   to: 0.4,  color: 'rgba(0,229,255,0.12)'  },
          { from: 0.4, to: 0.7,  color: 'rgba(255,200,0,0.12)'  },
          { from: 0.7, to: 1,    color: 'rgba(255,34,85,0.12)'  },
        ].map((z, i) => {
          const startOffset = totalArc - z.from * totalArc
          const endOffset   = totalArc - z.to   * totalArc
          const len = startOffset - endOffset
          return (
            <path
              key={i}
              d="M 15 95 A 85 85 0 0 1 185 95"
              fill="none"
              stroke={z.color}
              strokeWidth="16"
              strokeLinecap="butt"
              strokeDasharray={totalArc}
              strokeDashoffset={startOffset}
              style={{ strokeDasharray: `${len} ${totalArc - len}`, strokeDashoffset: endOffset }}
            />
          )
        })}

        {/* Fill arc */}
        <path
          ref={fillRef}
          d="M 15 95 A 85 85 0 0 1 185 95"
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={totalArc}
          strokeDashoffset={totalArc}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />

        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const angle = Math.PI - t * Math.PI
          const cx = 100 + 85 * Math.cos(angle)
          const cy = 95  - 85 * Math.sin(angle)
          return <circle key={i} cx={cx} cy={cy} r={2} fill="rgba(255,255,255,0.15)" />
        })}

        {/* Needle */}
        <g ref={needleRef} style={{ transformOrigin: '100px 95px' }}>
          <line x1="100" y1="95" x2="100" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <circle cx="100" cy="95" r="5" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
        </g>

        {/* Labels */}
        {['0', '2.5', '5', '7.5', '10'].map((lbl, i) => {
          const t = i / 4
          const angle = Math.PI - t * Math.PI
          const cx = 100 + 100 * Math.cos(angle)
          const cy = 95  - 100 * Math.sin(angle)
          return (
            <text key={lbl} x={cx} y={cy + 14} textAnchor="middle"
              fill="rgba(255,255,255,0.25)" fontSize="7" fontFamily="var(--font-mono)">
              {lbl}
            </text>
          )
        })}
      </svg>

      <div ref={numRef} className={styles.scoreNum} style={{ color }}>
        0.0
      </div>
      <div className={styles.scoreLabel} style={{ color }}>{label} RISK</div>
      <div className={styles.scoreSub}>CVSS SCORE</div>
    </div>
  )
}
