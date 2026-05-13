import { motion } from 'framer-motion'
import s from './ScanProgress.module.css'

const STEPS = [
  'Validating URL format',
  'Checking URLhaus database',
  'Verifying SSL certificate',
  'Analyzing URL patterns',
  'Running VirusTotal scan',
  'Generating AI analysis',
]

export default function ScanProgress({ pct, stepIdx }) {
  return (
    <motion.div className={s.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div
        className={s.modal}
        initial={{ scale: 0.94, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      >
        <div className={s.header}>
          <div className={s.dot} />
          <span className={s.title}>SCANNING IN PROGRESS</span>
        </div>

        <div className={s.track}>
          <motion.div
            className={s.fill}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ ease: 'easeOut', duration: 0.5 }}
          />
        </div>
        <div className={s.pct}>{pct}%</div>

        <div className={s.steps}>
          {STEPS.map((label, i) => {
            const done   = i < stepIdx
            const active = i === stepIdx
            return (
              <motion.div
                key={label}
                className={`${s.step} ${done ? s.done : ''} ${active ? s.active : ''}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <span className={s.icon}>{done ? '✓' : active ? '▶' : '○'}</span>
                {label}
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
