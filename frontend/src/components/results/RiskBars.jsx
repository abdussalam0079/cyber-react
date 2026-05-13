import { useEffect, useState } from 'react'
import s from './RiskBars.module.css'

export default function RiskBars({ score }) {
  const [go, setGo] = useState(false)
  useEffect(() => { const t = setTimeout(() => setGo(true), 150); return () => clearTimeout(t) }, [])

  const bars = [
    { label: 'ATTACK COMPLEXITY', value: Math.min(40 + score * 4,   98), color: 'var(--blue)'   },
    { label: 'EXPLOITABILITY',    value: Math.min(55 + score * 4.2, 98), color: 'var(--orange)' },
    { label: 'IMPACT SCOPE',      value: Math.min(45 + score * 5,   98), color: 'var(--red)'    },
    { label: 'PATCH PRIORITY',    value: Math.min(score * 10,       98), color: 'var(--accent)'  },
  ]

  return (
    <div className={s.wrap}>
      <div className={s.heading}>RISK BREAKDOWN</div>
      {bars.map((b, i) => (
        <div key={b.label} className={s.bar}>
          <div className={s.row}>
            <span className={s.label}>{b.label}</span>
            <span className={s.val} style={{ color: b.color }}>{Math.round(b.value)}%</span>
          </div>
          <div className={s.track}>
            <div
              className={s.fill}
              style={{
                background: b.color,
                width: go ? `${b.value}%` : '0%',
                transitionDelay: `${i * 0.1}s`,
                boxShadow: `0 0 8px ${b.color}55`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
