import { motion, AnimatePresence } from 'framer-motion'
import styles from './ScanConsole.module.css'
import { Send } from 'lucide-react'

export default function ScanConsole({ target, setTarget, scanning, progress, onScan }) {
  return (
    <div className={styles.console} role="region" aria-label="Scan console">
      <div className={styles.row}>
        <input
          value={target}
          onChange={e => setTarget(e.target.value)}
          className={styles.input}
          placeholder="https://example.com or example.com"
          disabled={scanning}
          onKeyDown={e => e.key === 'Enter' && onScan && onScan()}
          aria-label="Target URL"
        />
        <button className={styles.scanBtn} onClick={onScan} disabled={!target.trim() || scanning} aria-pressed={scanning}>
          <Send size={16} />
          {scanning ? 'Scanning' : 'Start Scan'}
        </button>
      </div>

      <div className={styles.chips} aria-hidden>
        <AnimatePresence>
          {['VirusTotal', 'URLScan', 'SafeBrowsing', 'SSL', 'WHOIS'].map((c, i) => (
            <motion.span key={c} className={styles.chip} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.06 }}>
              {c} ✓
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {scanning && progress && (
          <motion.div className={styles.progressWrap} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className={styles.progressLabel}>{progress.step}</div>
            <div className={styles.progressBar} aria-hidden>
              <motion.div className={styles.progressFill} initial={{ width: 0 }} animate={{ width: `${progress.pct}%` }} transition={{ ease: 'easeInOut' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
