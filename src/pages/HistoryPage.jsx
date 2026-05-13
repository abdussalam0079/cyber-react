import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Trash2 } from 'lucide-react'
import { getHistory, clearHistory, deleteHistoryItem } from '../utils/scanner'
import styles from './HistoryPage.module.css'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    async function load() {
      setHistory(await getHistory())
    }
    load()
  }, [])

  const handleClear = async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    await clearHistory()
    setHistory([])
    setConfirmClear(false)
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    await deleteHistoryItem(id)
    setHistory(await getHistory())
  }

  const getSeverityIcon = (severity) => {
    const icons = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }
    return icons[severity] || '⚪'
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Scan History</h1>
            <p className={styles.subtitle}>View and manage your previous security scans.</p>
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
              {history.map((scan) => (
                <div
                  key={scan.id}
                  className={styles.item}
                  onClick={() => navigate('/results', { state: { scan } })}
                >
                  <div className={styles.itemContent}>
                    <div className={styles.itemTime}>
                      {new Date(scan.timestamp).toLocaleString()}
                    </div>
                    <div className={styles.itemTarget}>{scan.target}</div>
                    <div className={styles.itemStats}>
                      {scan.summary.critical > 0 && (
                        <div className={styles.stat}>
                          <span>🔴</span>
                          <span className={styles.statLabel}>Critical:</span>
                          <span className={styles.statValue + ' ' + styles.criticalValue}>
                            {scan.summary.critical}
                          </span>
                        </div>
                      )}
                      {scan.summary.high > 0 && (
                        <div className={styles.stat}>
                          <span>🟠</span>
                          <span className={styles.statLabel}>High:</span>
                          <span className={styles.statValue + ' ' + styles.highValue}>
                            {scan.summary.high}
                          </span>
                        </div>
                      )}
                      {scan.summary.medium > 0 && (
                        <div className={styles.stat}>
                          <span>🟡</span>
                          <span className={styles.statLabel}>Medium:</span>
                          <span className={styles.statValue + ' ' + styles.mediumValue}>
                            {scan.summary.medium}
                          </span>
                        </div>
                      )}
                      {scan.summary.low > 0 && (
                        <div className={styles.stat}>
                          <span>🟢</span>
                          <span className={styles.statLabel}>Low:</span>
                          <span className={styles.statValue + ' ' + styles.lowValue}>
                            {scan.summary.low}
                          </span>
                        </div>
                      )}
                      {scan.threats.length === 0 && (
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
