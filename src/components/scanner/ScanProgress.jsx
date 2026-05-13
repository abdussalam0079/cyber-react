import { motion } from 'framer-motion'
import { SCAN_STEPS } from '../../utils/scanner.js'
import styles from './ScanProgress.module.css'

export default function ScanProgress({ progress }) {
  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
      >
        <div className={styles.modalGlow} />

        <div className={styles.title}>⬡ SCANNING IN PROGRESS</div>
        <div className={styles.stepLabel}>{progress.step}...</div>

        {/* Progress bar */}
        <div className={styles.trackWrap}>
          <div className={styles.track}>
            <motion.div
              className={styles.fill}
              initial={{ width: 0 }}
              animate={{ width: `${progress.pct}%` }}
              transition={{ ease: 'easeOut', duration: 0.4 }}
            />
            <div className={styles.shimmer} />
          </div>
        </div>

        <div className={styles.pct}>{progress.pct}%</div>

        {/* Step list */}
        <div className={styles.steps}>
          {SCAN_STEPS.map((s, i) => {
            const done   = i < progress.stepIdx
            const active = i === progress.stepIdx
            return (
              <motion.div
                key={s.label}
                className={`${styles.step} ${done ? styles.done : ''} ${active ? styles.active : ''}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <span className={styles.stepIcon}>
                  {done ? '✓' : active ? '▶' : '○'}
                </span>
                {s.label}
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
