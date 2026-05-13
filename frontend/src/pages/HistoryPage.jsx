import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, Trash2, Clock, ShieldAlert, ShieldCheck } from 'lucide-react'
import { getHistory, clearHistory, deleteHistoryItem } from '../utils/scanner.js'
import s from './HistoryPage.module.css'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [history, setHistory]       = useState([])
  const [confirmClear, setConfirm]  = useState(false)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    getHistory().then(h => { setHistory(h); setLoading(false) })
  }, [])

  async function handleClear() {
    if (!confirmClear) { setConfirm(true); return }
    await clearHistory()
    setHistory([])
    setConfirm(false)
  }

  async function handleDelete(id, e) {
    e.stopPropagation()
    await deleteHistoryItem(id)
    setHistory(h => h.filter(i => i.id !== id))
  }

  const sevColor = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' }

  return (
    <div className={s.page}>
      <div className={s.container}>
        <div className={s.header}>
          <div>
            <h1 className={s.title}>Scan History</h1>
            <p className={s.sub}>Your previous URL threat scans</p>
          </div>
          {history.length > 0 && (
            <button className={`${s.clearBtn} ${confirmClear ? s.confirm : ''}`} onClick={handleClear}>
              <Trash2 size={14} />
              {confirmClear ? 'Confirm Clear All' : 'Clear All'}
            </button>
          )}
        </div>

        {loading ? (
          <div className={s.empty}>
            <div className={s.spinner} />
          </div>
        ) : history.length === 0 ? (
          <div className={s.empty}>
            <Clock size={36} className={s.emptyIcon} />
            <p className={s.emptyText}>No scans yet</p>
            <button className={s.startBtn} onClick={() => navigate('/')}>
              Run Your First Scan
            </button>
          </div>
        ) : (
          <div className={s.list}>
            {history.map((scan, i) => (
              <motion.div
                key={scan.id}
                className={s.item}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate('/results', { state: { scan } })}
              >
                <div className={scan.safe ? s.safeIcon : s.dangerIcon}>
                  {scan.safe
                    ? <ShieldCheck size={16} />
                    : <ShieldAlert size={16} />}
                </div>

                <div className={s.itemBody}>
                  <div className={s.itemUrl}>{scan.target}</div>
                  <div className={s.itemMeta}>
                    <span className={s.itemTime}>
                      <Clock size={11} />
                      {new Date(scan.timestamp).toLocaleString()}
                    </span>
                    <div className={s.badges}>
                      {['critical','high','medium','low'].map(sev =>
                        scan.summary[sev] > 0 ? (
                          <span
                            key={sev}
                            className={s.badge}
                            style={{ color: sevColor[sev], borderColor: `${sevColor[sev]}44`, background: `${sevColor[sev]}11` }}
                          >
                            {scan.summary[sev]} {sev}
                          </span>
                        ) : null
                      )}
                      {scan.safe && (
                        <span className={s.badge} style={{ color: '#22c55e', borderColor: '#22c55e44', background: '#22c55e11' }}>
                          safe
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={s.itemScore} style={{ color: scan.score >= 7 ? '#ef4444' : scan.score >= 4 ? '#f97316' : '#22c55e' }}>
                  {scan.score.toFixed(1)}
                </div>

                <div className={s.itemActions}>
                  <button className={s.viewBtn} title="View" onClick={e => { e.stopPropagation(); navigate('/results', { state: { scan } }) }}>
                    <Eye size={15} />
                  </button>
                  <button className={s.delBtn} title="Delete" onClick={e => handleDelete(scan.id, e)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
