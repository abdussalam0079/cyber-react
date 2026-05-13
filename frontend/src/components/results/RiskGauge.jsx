import { useEffect, useRef } from 'react'
import styles from './RiskGauge.module.css'

const SEV = (s) =>
  s >= 9 ? { label: 'CRITICAL', color: '#ff2255' } :
  s >= 7 ? { label: 'HIGH',     color: '#ff7700' } :
  s >= 4 ? { label: 'MEDIUM',   color: '#ffc800' } :
           { label: 'LOW',      color: '#00ffe0' }

export default function RiskGauge({ score }) {
  const fillRef = useRef(null)
  const { label, color } = SEV(score)

  // Arc math: semicircle from left to right
  // total arc length ≈ 220 for our viewBox
  const totalArc   = 220
  const pct        = Math.min(score / 10, 1)
  const dashOffset = totalArc - pct * totalArc

  useEffect(() => {
    if (!fillRef.current) return
    // Small delay to trigger CSS transition
    const id = setTimeout(() => {
      fillRef.current.style.strokeDashoffset = dashOffset
    }, 120)
    return () => clearTimeout(id)
  }, [dashOffset])

  return (
    <div className={styles.wrap}>
      <svg className={styles.svg} viewBox="0 0 200 105" overflow="visible">
        {/* Track */}
        <path
          d="M 15 95 A 85 85 0 0 1 185 95"
          fill="none"
          stroke="var(--border)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Tick marks at 25% intervals */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const angle = Math.PI - t * Math.PI
          const cx    = 100 + 85 * Math.cos(angle)
          const cy    = 95  - 85 * Math.sin(angle)
          return <circle key={i} cx={cx} cy={cy} r={2.5} fill="var(--card)" />
        })}
        {/* Fill */}
        <path
          ref={fillRef}
          d="M 15 95 A 85 85 0 0 1 185 95"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={totalArc}
          strokeDashoffset={totalArc}
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
        {/* Score labels along arc */}
        {['0', '2.5', '5', '7.5', '10'].map((lbl, i) => {
          const t     = i / 4
          const angle = Math.PI - t * Math.PI
          const r     = 100
          const cx    = 100 + r * Math.cos(angle)
          const cy    = 95  - r * Math.sin(angle)
          return (
            <text
              key={lbl}
              x={cx} y={cy + 18}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="7"
              fontFamily="var(--mono)"
            >
              {lbl}
            </text>
          )
        })}
      </svg>

      {/* Score number */}
      <div className={styles.scoreNum} style={{ color }}>
        {score.toFixed(1)}
      </div>
      <div className={styles.scoreLabel} style={{ color }}>
        {label} RISK
      </div>
      <div className={styles.scoreSub}>CVSS SCORE</div>
    </div>
  )
}
