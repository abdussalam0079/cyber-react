import { useEffect, useRef, useState } from 'react'
import styles from './RiskBars.module.css'

const BARS = (score) => [
  { label: 'ATTACK COMPLEXITY', value: 40 + score * 4,   color: 'var(--blue)'   },
  { label: 'EXPLOITABILITY',    value: 55 + score * 4.2, color: 'var(--orange)' },
  { label: 'IMPACT SCOPE',      value: 45 + score * 5,   color: 'var(--red)'    },
  { label: 'PATCH PRIORITY',    value: score * 10,        color: 'var(--neon)'   },
]

export default function RiskBars({ score }) {
  const [animated, setAnimated] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200)
    return () => clearTimeout(t)
  }, [])

  const bars = BARS(score).map(b => ({ ...b, value: Math.min(b.value, 98) }))

  return (
    <div className={styles.wrap} ref={ref}>
      <div className={styles.heading}>RISK BREAKDOWN</div>
      <div className={styles.bars}>
        {bars.map((b, i) => (
          <div key={b.label} className={styles.bar}>
            <div className={styles.barHeader}>
              <span className={styles.barLabel}>{b.label}</span>
              <span className={styles.barVal} style={{ color: b.color }}>
                {Math.round(b.value)}%
              </span>
            </div>
            <div className={styles.track}>
              <div
                className={styles.fill}
                style={{
                  background: b.color,
                  width: animated ? `${b.value}%` : '0%',
                  transitionDelay: `${i * 0.1}s`,
                  boxShadow: `0 0 10px ${b.color}55`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
