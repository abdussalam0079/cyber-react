import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Shield, Zap, Globe, Lock, Eye, Activity } from 'lucide-react'
import GlitchText from './GlitchText'
import MagneticButton from './MagneticButton'
import CountUp from './CountUp'
import styles from './Hero.module.css'

const STATS = [
  { label: 'Threat Sources', value: 7, suffix: '+' },
  { label: 'Avg Scan Time', value: 8, suffix: 's' },
  { label: 'Detection Rate', value: 99, suffix: '%' },
]

const SOURCES = [
  { icon: <Shield size={13} />, label: 'URLhaus' },
  { icon: <Eye size={13} />, label: 'VirusTotal' },
  { icon: <Globe size={13} />, label: 'Safe Browsing' },
  { icon: <Lock size={13} />, label: 'PhishTank' },
  { icon: <Activity size={13} />, label: 'URLScan.io' },
  { icon: <Zap size={13} />, label: 'SSL + WHOIS' },
]

export default function Hero({ onPrimary }) {
  const contentRef = useRef(null)
  const statsRef = useRef([])
  const chipsRef = useRef([])
  const vizRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.fromTo(contentRef.current.querySelector(`.${styles.overline}`),
      { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }
    )
    .fromTo(contentRef.current.querySelector(`.${styles.titleWrap}`),
      { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.3'
    )
    .fromTo(contentRef.current.querySelector(`.${styles.lead}`),
      { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4'
    )
    .fromTo(contentRef.current.querySelector(`.${styles.ctas}`),
      { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3'
    )
    .fromTo(statsRef.current,
      { opacity: 0, y: 20, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1 }, '-=0.2'
    )
    .fromTo(chipsRef.current,
      { opacity: 0, x: -12 },
      { opacity: 1, x: 0, duration: 0.4, stagger: 0.06 }, '-=0.3'
    )

    // Animate viz
    if (vizRef.current) {
      gsap.fromTo(vizRef.current,
        { opacity: 0, scale: 0.9, rotationY: 8 },
        { opacity: 1, scale: 1, rotationY: 0, duration: 1, ease: 'power3.out', delay: 0.4 }
      )
      // Floating animation
      gsap.to(vizRef.current, {
        y: -10,
        duration: 3.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 1,
      })
    }
  }, [])

  return (
    <section className={styles.hero} aria-label="Hero">
      <div ref={contentRef} className={styles.left}>
        <p className={styles.overline}>
          <span className={styles.liveDot} /> Real-Time Threat Intelligence
        </p>

        <div className={styles.titleWrap}>
          <h1 className={styles.title}>
            <GlitchText text="Scan. Detect." tag="span" className={styles.titleLine1} />
            <br />
            <span className={styles.titleLine2}>
              <span className={styles.titleGrad}>Neutralize.</span>
            </span>
          </h1>
        </div>

        <p className={styles.lead}>
          7+ live threat intelligence sources — malware databases, phishing registries,
          SSL analysis, domain age, and AI-powered verdict. Every scan is real.
        </p>

        <div className={styles.ctas}>
          <MagneticButton className={styles.primary} onClick={onPrimary}>
            <Zap size={16} /> Start Threat Scan
          </MagneticButton>
          <button className={styles.secondary} onClick={() => document.getElementById('tech')?.scrollIntoView({ behavior: 'smooth' })}>
            How it works ↓
          </button>
        </div>

        {/* Stat counters */}
        <div className={styles.stats}>
          {STATS.map((s, i) => (
            <div key={s.label} ref={el => statsRef.current[i] = el} className={styles.statItem}>
              <strong className={styles.statVal}>
                <CountUp value={s.value} suffix={s.suffix} duration={1.4} delay={0.8 + i * 0.1} />
              </strong>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Visual panel */}
      <div className={styles.right}>
        <div ref={vizRef} className={styles.vizCard}>
          <div className={styles.vizHeader}>
            <span className={styles.vizDot} />
            <span className={styles.vizDot} style={{ background: '#fbbf24' }} />
            <span className={styles.vizDot} style={{ background: '#34d399' }} />
            <span className={styles.vizTitle}>THREAT ANALYSIS ENGINE</span>
          </div>

          <div className={styles.vizBody}>
            {/* Animated scan line */}
            <div className={styles.scanLine} />

            {/* Source chips */}
            <div className={styles.sourceChips}>
              {SOURCES.map((s, i) => (
                <div
                  key={s.label}
                  ref={el => chipsRef.current[i] = el}
                  className={styles.sourceChip}
                  style={{ animationDelay: `${i * 0.4}s` }}
                >
                  {s.icon}
                  <span>{s.label}</span>
                  <span className={styles.chipPulse} />
                </div>
              ))}
            </div>

            {/* Mini bar chart */}
            <div className={styles.miniChart}>
              {['URLhaus', 'VT', 'GSB', 'PT', 'SSL', 'DOM', 'PAT'].map((l, i) => (
                <div key={l} className={styles.miniBar}>
                  <div
                    className={styles.miniBarFill}
                    style={{
                      height: `${[45, 78, 62, 55, 88, 40, 70][i]}%`,
                      animationDelay: `${0.6 + i * 0.1}s`,
                    }}
                  />
                  <span className={styles.miniBarLabel}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.vizFooter}>
            <span className={styles.vizStatus}>
              <span className={styles.vizPulse} /> All systems operational
            </span>
            <span className={styles.vizVersion}>v3.0</span>
          </div>
        </div>
      </div>
    </section>
  )
}
