import { useEffect, useRef } from 'react'
import s from './RiskGauge.module.css'

function sevInfo(score) {
  if (score >= 9) return { label: 'CRITICAL', color: '#ef4444' }
  if (score >= 7) return { label: 'HIGH',     color: '#f97316' }
  if (score >= 4) return { label: 'MEDIUM',   color: '#eab308' }
  if (score > 0)  return { label: 'LOW',      color: '#22c55e' }
  return                  { label: 'SAFE',    color: '#22c55e' }
}

export default function RiskGauge({ score }) {
  const fillRef = useRef(null)
  const { label, color } = sevInfo(score)
  const totalArc = 220
  const dashOffset = totalArc - Math.min(score / 10, 1) * totalArc

  useEffect(() => {
    const id = setTimeout(() => {
      if (fillRef.current) fillRef.current.style.strokeDashoffset = dashOffset
    }, 100)
    return () => clearTimeout(id)
  }, [dashOffset])

  return (
    <div className={s.wrap}>
      <svg className={s.svg} viewBox="0 0 200 110" overflow="visible">
        <path d="M 15 95 A 85 85 0 0 1 185 95" fill="none" stroke="var(--border)" strokeWidth="10" strokeLinecap="round" />
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const a = Math.PI - t * Math.PI
          return <circle key={i} cx={100 + 85 * Math.cos(a)} cy={95 - 85 * Math.sin(a)} r={2.5} fill="var(--bg2)" />
        })}
        <path
          ref={fillRef}
          d="M 15 95 A 85 85 0 0 1 185 95"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={totalArc}
          strokeDashoffset={totalArc}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${color})` }}
        />
        {['0','2.5','5','7.5','10'].map((lbl, i) => {
          const a = Math.PI - (i / 4) * Math.PI
          const cx = 100 + 100 * Math.cos(a)
          const cy = 95  - 100 * Math.sin(a)
          return <text key={lbl} x={cx} y={cy + 18} textAnchor="middle" fill="var(--text-muted)" fontSize="7" fontFamily="var(--mono)">{lbl}</text>
        })}
      </svg>
      <div className={s.num} style={{ color }}>{score.toFixed(1)}</div>
      <div className={s.label} style={{ color }}>{label} RISK</div>
      <div className={s.sub}>CVSS SCORE</div>
    </div>
  )
}
