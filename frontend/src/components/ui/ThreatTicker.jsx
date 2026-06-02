import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import styles from './ThreatTicker.module.css'

export default function ThreatTicker({ threats = [], sources = {} }) {
  const trackRef = useRef(null)
  const tlRef = useRef(null)

  const items = [
    ...(threats.map(t => `${t.severity.toUpperCase()} · ${t.name} — ${t.source}`)),
    sources.urlhaus ? '✓ URLhaus — Clean' : null,
    sources.virustotal ? '✓ VirusTotal — Scanned' : null,
    sources.gsb ? '✓ Safe Browsing — Checked' : null,
    sources.ssl ? '✓ SSL Certificate — Verified' : null,
    sources.domain ? '✓ Domain Age — Analyzed' : null,
    '⬡ CYBERSCAN — Real-time threat intelligence',
    '⬡ 7 Intelligence sources active',
  ].filter(Boolean)

  useEffect(() => {
    const track = trackRef.current
    if (!track || items.length === 0) return

    // Duplicate items for seamless loop
    track.innerHTML = ''
    const content = [...items, ...items].map(text => {
      const span = document.createElement('span')
      span.className = styles.item
      span.textContent = text
      // Color critical items
      if (text.startsWith('CRITICAL')) span.style.color = '#ff2255'
      else if (text.startsWith('HIGH')) span.style.color = '#ff7700'
      else if (text.startsWith('MEDIUM')) span.style.color = '#ffc800'
      else if (text.startsWith('LOW')) span.style.color = '#4ade80'
      track.appendChild(span)
      return span
    })

    const totalWidth = track.scrollWidth / 2
    tlRef.current = gsap.to(track, {
      x: -totalWidth,
      duration: items.length * 4,
      ease: 'none',
      repeat: -1,
    })

    return () => tlRef.current?.kill()
  }, [items.length])

  return (
    <div className={styles.ticker}>
      <div className={styles.label}>LIVE</div>
      <div className={styles.mask}>
        <div ref={trackRef} className={styles.track} />
      </div>
    </div>
  )
}
