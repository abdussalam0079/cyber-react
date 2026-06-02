import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { SCAN_STEPS } from '../../utils/scanner.js'
import styles from './ScanProgress.module.css'

export default function ScanProgress({ progress }) {
  const overlayRef = useRef(null)
  const modalRef = useRef(null)
  const fillRef = useRef(null)
  const stepsRef = useRef([])
  const pctRef = useRef(null)
  const glowRef = useRef(null)
  const mountedRef = useRef(false)

  // Entrance animation on first mount
  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    const tl = gsap.timeline()
    tl.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' }
    )
    tl.fromTo(modalRef.current,
      { opacity: 0, scale: 0.94, y: 28 },
      { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)' },
      '-=0.1'
    )
    tl.fromTo(stepsRef.current,
      { opacity: 0, x: -16 },
      { opacity: 1, x: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' },
      '-=0.2'
    )
  }, [])

  // Animate progress bar + percentage counter
  useEffect(() => {
    if (!fillRef.current || !pctRef.current) return

    gsap.to(fillRef.current, {
      width: `${progress.pct}%`,
      duration: 0.5,
      ease: 'power2.out',
    })

    gsap.to({ val: parseFloat(pctRef.current.textContent) || 0 }, {
      val: progress.pct,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate() {
        if (pctRef.current) pctRef.current.textContent = `${Math.round(this.targets()[0].val)}%`
      },
    })

    // Pulse the glow on step change
    if (glowRef.current) {
      gsap.fromTo(glowRef.current,
        { opacity: 0.6, scale: 1.1 },
        { opacity: 0.2, scale: 1, duration: 0.8, ease: 'power2.out' }
      )
    }
  }, [progress.pct, progress.stepIdx])

  // Highlight active/done steps
  useEffect(() => {
    stepsRef.current.forEach((el, i) => {
      if (!el) return
      const isDone = i < progress.stepIdx
      const isActive = i === progress.stepIdx
      gsap.to(el, {
        opacity: isDone ? 0.5 : isActive ? 1 : 0.35,
        x: isActive ? 4 : 0,
        duration: 0.3,
        ease: 'power2.out',
      })
    })
  }, [progress.stepIdx])

  return (
    <div ref={overlayRef} className={styles.overlay}>
      <div ref={modalRef} className={styles.modal}>
        <div ref={glowRef} className={styles.modalGlow} />

        <div className={styles.header}>
          <div className={styles.statusDot} />
          <span className={styles.title}>SCANNING IN PROGRESS</span>
          <span className={styles.scanId}>SCAN-{Date.now().toString().slice(-6)}</span>
        </div>

        <div className={styles.stepLabel}>
          <span className={styles.stepArrow}>▶</span>
          {progress.step}
        </div>

        <div className={styles.trackWrap}>
          <div className={styles.track}>
            <div ref={fillRef} className={styles.fill} style={{ width: '0%' }} />
            <div className={styles.shimmer} />
          </div>
          <div ref={pctRef} className={styles.pct}>0%</div>
        </div>

        <div className={styles.steps}>
          {SCAN_STEPS.map((s, i) => {
            const done   = i < progress.stepIdx
            const active = i === progress.stepIdx
            return (
              <div
                key={s.key}
                ref={el => stepsRef.current[i] = el}
                className={`${styles.step} ${done ? styles.done : ''} ${active ? styles.active : ''}`}
              >
                <span className={styles.stepIcon}>
                  {done ? '✓' : active ? '▶' : '○'}
                </span>
                <span className={styles.stepText}>{s.label}</span>
                {done && <span className={styles.stepCheck}>✓</span>}
              </div>
            )
          })}
        </div>

        <div className={styles.footer}>
          <span>{progress.stepIdx + 1} / {SCAN_STEPS.length} checks</span>
          <span>Powered by 7+ intelligence sources</span>
        </div>
      </div>
    </div>
  )
}
