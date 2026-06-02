import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Trash2, Clock, Shield, AlertTriangle } from 'lucide-react'
import { gsap } from 'gsap'
import { getHistory, clearHistory, deleteHistoryItem } from '../utils/scanner'
import styles from './HistoryPage.module.css'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [confirmClear, setConfirmClear] = useState(false)
  const pageRef  = useRef(null)
  const itemRefs = useRef([])

  useEffect(() => {
    async function load() {
      const h = await getHistory()
      setHistory(h)
      setTimeout(() => {
        if (itemRefs.current.length)
          gsap.fromTo(itemRefs.current.filter(Boolean),
            { opacity: 0, x: -24 },
            { opacity: 1, x: 0, duration: 0.5, stagger: 0.07, ease: 'power3.out' }
          )
      }, 50)
    }
    gsap.fromTo(pageRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
    load()
  }, [])

  const handleClear = async () => {
    if (!confirmClear) { setConfirmClear(true); return }
    await clearHistory()
    setHistory([])
    setConfirmClear(false)
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    const el = itemRefs.current.find((r, i) => history[i]?.id === id)
    if (el) {
      await new Promise(resolve =>
        gsap.to(el, { opacity: 0, x: 40, height: 0, marginBottom: 0, padding: 0, duration: 0.35, ease: 'power2.in', onComplete: resolve })
      )
    }
    await deleteHistoryItem(id)
    setHistory(await getHistory())
  }

  return (
    <div ref={pageRef} className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <div className={styles.headerBadge}><Clock size={13}/> SCAN HISTORY</div>
            <h1 className={styles.title}>Previous Scans</h1>
            <p className={styles.subtitle}>Click any scan to view the full threat report.</p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📋</div>
            <p className={styles.emptyText}>No scans yet. Start by running a new threat detection.</p>
            <button
              className={styles.actionButton}
              onClick={() => navigate('/')}
              style={{ marginTop: '1rem' }}
            >
              Run Your First Scan
            </button>
          </div>
        ) : (
          <>
            <div className={styles.toolbar}>
              <span className={styles.count}>{history.length} scan(s) saved</span>
              <button className={styles.clearButton} onClick={handleClear}>
                <Trash2 size={16} />
                {confirmClear ? 'Confirm Clear All' : 'Clear History'}
              </button>
            </div>

            <div className={styles.history}>
              {history.map((scan, i) => (
                <div
                  key={scan.id}
                  ref={el => itemRefs.current[i] = el}
                  className={styles.item}
                  onClick={() => navigate('/results', { state: { scan } })}
                >
                  <div className={styles.itemContent}>
                    <div className={styles.itemTime}>
                      {new Date(scan.timestamp).toLocaleString()}
                    </div>
                    <div className={styles.itemTarget}>{scan.target}</div>
                    <div className={styles.itemStats}>
                      {(scan.summary?.critical ?? 0) > 0 && (
                        <div className={styles.stat}>
                          <span>🔴</span>
                          <span className={styles.statLabel}>Critical:</span>
                          <span className={styles.statValue + ' ' + styles.criticalValue}>
                            {scan.summary.critical}
                          </span>
                        </div>
                      )}
                      {(scan.summary?.high ?? 0) > 0 && (
                        <div className={styles.stat}>
                          <span>🟠</span>
                          <span className={styles.statLabel}>High:</span>
                          <span className={styles.statValue + ' ' + styles.highValue}>
                            {scan.summary.high}
                          </span>
                        </div>
                      )}
                      {(scan.summary?.medium ?? 0) > 0 && (
                        <div className={styles.stat}>
                          <span>🟡</span>
                          <span className={styles.statLabel}>Medium:</span>
                          <span className={styles.statValue + ' ' + styles.mediumValue}>
                            {scan.summary.medium}
                          </span>
                        </div>
                      )}
                      {(scan.summary?.low ?? 0) > 0 && (
                        <div className={styles.stat}>
                          <span>🟢</span>
                          <span className={styles.statLabel}>Low:</span>
                          <span className={styles.statValue + ' ' + styles.lowValue}>
                            {scan.summary.low}
                          </span>
                        </div>
                      )}
                      {(scan.threats?.length ?? 0) === 0 && (
                        <div className={styles.stat}>
                          <span>✅</span>
                          <span className={styles.statLabel}>Status:</span>
                          <span className={styles.statValue}>SAFE</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <button className={styles.viewButton} title="View Report">
                      <Eye size={18} />
                    </button>
                    <button
                      className={styles.deleteButton}
                      title="Delete Scan"
                      onClick={(e) => handleDelete(scan.id, e)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
