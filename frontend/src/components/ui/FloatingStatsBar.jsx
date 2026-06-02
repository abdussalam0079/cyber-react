import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import styles from './FloatingStatsBar.module.css'

export default function FloatingStatsBar({ scan }) {
  const barRef = useRef(null)

  useEffect(() => {
    if (!barRef.current) return
    gsap.fromTo(barRef.current,
      { y: 80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'back.out(1.6)', delay: 1.2 }
    )
    return () => gsap.killTweensOf(barRef.current)
  }, [])

  const stats = [
    { label: 'Threat Score', value: `${scan.score.toFixed(1)}/10`, accent: scan.score >= 7 ? '#ff2255' : scan.score >= 4 ? '#ff7700' : '#4ade80' },
    { label: 'Critical', value: scan.summary?.critical ?? 0, accent: '#ff2255' },
    { label: 'High', value: scan.summary?.high ?? 0, accent: '#ff7700' },
    { label: 'Sources', value: Object.values(scan.sources || {}).filter(Boolean).length, accent: '#6366f1' },
    { label: 'Status', value: scan.safe ? 'SAFE' : 'THREAT', accent: scan.safe ? '#4ade80' : '#ff2255' },
  ]

  return (
    <div ref={barRef} className={styles.bar}>
      {stats.map(s => (
        <div key={s.label} className={styles.stat}>
          <span className={styles.statVal} style={{ color: s.accent }}>{s.value}</span>
          <span className={styles.statLabel}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}
