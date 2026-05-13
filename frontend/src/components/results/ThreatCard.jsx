import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Shield, ExternalLink } from 'lucide-react'
import s from './ThreatCard.module.css'

const SEV = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)'  },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' },
  medium:   { color: '#eab308', bg: 'rgba(234,179,8,0.1)',  border: 'rgba(234,179,8,0.3)'  },
  low:      { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)'  },
}

export default function ThreatCard({ threat, index }) {
  const [open, setOpen] = useState(false)
  const sev = SEV[threat.severity] || SEV.low

  return (
    <motion.div
      className={s.card}
      style={{ borderColor: open ? sev.border : 'var(--border)' }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className={s.header} onClick={() => setOpen(o => !o)}>
        <span
          className={s.badge}
          style={{ color: sev.color, background: sev.bg, borderColor: sev.border }}
        >
          {threat.severity.toUpperCase()}
        </span>

        <div className={s.center}>
          <div className={s.name}>{threat.name}</div>
          <div className={s.source}>{threat.source}</div>
        </div>

        <div className={s.right}>
          <div className={s.score} style={{ color: sev.color }}>
            <span className={s.scoreNum}>{threat.score.toFixed(1)}</span>
            <span className={s.scoreLbl}>CVSS</span>
          </div>
          <div className={s.chevron} style={{ color: sev.color }}>
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className={s.body}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className={s.bodyInner}>
              <p className={s.desc}>{threat.description}</p>
              <div className={s.meta}>
                <div className={s.metaItem}>
                  <div className={s.metaLabel}>OWASP</div>
                  <div className={s.metaVal}>{threat.owasp}</div>
                </div>
                <div className={s.metaItem}>
                  <div className={s.metaLabel}>RECOMMENDATION</div>
                  <div className={s.metaVal}>{threat.recommendation}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
