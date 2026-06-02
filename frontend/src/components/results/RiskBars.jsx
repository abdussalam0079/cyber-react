import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import styles from './RiskBars.module.css'

const BARS = (score) => [
  { label: 'ATTACK COMPLEXITY', value: Math.min(40 + score * 4,   98), color: '#38bdf8' },
  { label: 'EXPLOITABILITY',    value: Math.min(55 + score * 4.2, 98), color: '#f97316' },
  { label: 'IMPACT SCOPE',      value: Math.min(45 + score * 5,   98), color: '#fb7185' },
  { label: 'PATCH PRIORITY',    value: Math.min(score * 10,        98), color: '#22d3ee' },
]

export default function RiskBars({ score }) {
  const fillRefs = useRef([])
  const wrapRef  = useRef(null)

  useEffect(() => {
    const fills = fillRefs.current.filter(Boolean)
    const bars  = BARS(score)

    gsap.fromTo(fills,
      { width: '0%' },
      {
        width: (i) => `${bars[i]?.value ?? 0}%`,
        duration: 1.2,
        ease: 'power3.out',
        stagger: 0.12,
        delay: 0.4,
      }
    )
  }, [score])

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.heading}>RISK BREAKDOWN</div>
      <div className={styles.bars}>
        {BARS(score).map((b, i) => (
          <div key={b.label} className={styles.bar}>
            <div className={styles.barHeader}>
              <span className={styles.barLabel}>{b.label}</span>
              <span className={styles.barVal} style={{ color: b.color }}>
                {Math.round(b.value)}%
              </span>
            </div>
            <div className={styles.track}>
              <div
                ref={el => fillRefs.current[i] = el}
                className={styles.fill}
                style={{
                  background: `linear-gradient(90deg, ${b.color}99, ${b.color})`,
                  boxShadow: `0 0 8px ${b.color}66`,
                  width: '0%',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
