import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { saveToHistory } from '../utils/scanner'
import styles from './ResultsPage.module.css'

export default function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const scan = location.state?.scan

  useEffect(() => {
    if (scan) {
      saveToHistory(scan)
    } else {
      navigate('/')
    }
  }, [scan, navigate])

  if (!scan) return null

  const exportReport = () => {
    const lines = [
      '═══════════════════════════════════════════════════',
      '        CYBERSCAN THREAT DETECTION REPORT',
      '═══════════════════════════════════════════════════',
      '',
      `Target: ${scan.target}`,
      `Date: ${new Date(scan.timestamp).toLocaleString()}`,
      `Threat Score: ${scan.score.toFixed(1)}/10`,
      `Status: ${scan.safe ? 'SAFE' : 'THREATS DETECTED'}`,
      '',
      'RISK SUMMARY',
      `  🔴 Critical: ${scan.summary.critical}`,
      `  🟠 High: ${scan.summary.high}`,
      `  🟡 Medium: ${scan.summary.medium}`,
      `  🟢 Low: ${scan.summary.low}`,
      '',
      ...(scan.threats.length > 0
        ? [
            'DETECTED THREATS',
            ...scan.threats.flatMap((t) => [
              '',
              `[${t.severity.toUpperCase()}] ${t.name}`,
              `  Source: ${t.source}`,
              `  Score: ${t.score}/10`,
              `  Description: ${t.description}`,
              `  OWASP: ${t.owasp}`,
              `  Action: ${t.recommendation}`,
            ]),
          ]
        : ['No threats detected during scan.']),
      '',
      '═══════════════════════════════════════════════════',
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cyberscan-report-${scan.target.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Threat Analysis Report</h1>
            <p className={styles.timestamp}>
              Scanned {new Date(scan.timestamp).toLocaleDateString()} at{' '}
              {new Date(scan.timestamp).toLocaleTimeString()}
            </p>
          </div>
          <button
            className={styles.actionButton}
            onClick={() => navigate('/')}
            style={{ marginTop: '1rem' }}
          >
            <ArrowLeft size={16} />
            New Scan
          </button>
        </div>

        <div className={styles.targetInfo}>
          <span style={{ fontSize: '1.2rem' }}>{scan.safe ? '✅' : '⚠️'}</span>
          <div>
            <strong>Target URL:</strong>
            <div className={styles.targetUrl}>{scan.target}</div>
          </div>
        </div>

        {scan.safe ? (
          <div className={styles.safe}>
            <div className={styles.safeIcon}>✨</div>
            <p className={styles.safeText}>This URL appears to be safe!</p>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              No immediate threats detected by our analysis.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.riskSection}>
              <h2 className={styles.riskTitle}>
                <AlertCircle size={18} />
                Risk Summary
              </h2>
              <div className={styles.riskSummary}>
                <div className={`${styles.riskCard} ${styles.critical}`}>
                  <div className={styles.riskNumber}>{scan.summary.critical}</div>
                  <div className={styles.riskLabel}>Critical</div>
                </div>
                <div className={`${styles.riskCard} ${styles.high}`}>
                  <div className={styles.riskNumber}>{scan.summary.high}</div>
                  <div className={styles.riskLabel}>High</div>
                </div>
                <div className={`${styles.riskCard} ${styles.medium}`}>
                  <div className={styles.riskNumber}>{scan.summary.medium}</div>
                  <div className={styles.riskLabel}>Medium</div>
                </div>
                <div className={`${styles.riskCard} ${styles.low}`}>
                  <div className={styles.riskNumber}>{scan.summary.low}</div>
                  <div className={styles.riskLabel}>Low</div>
                </div>
              </div>
            </div>

            <div className={styles.riskSection}>
              <h2 className={styles.riskTitle}>
                <AlertCircle size={18} />
                Detected Threats
              </h2>
              <div className={styles.threats}>
                {scan.threats.map((threat) => (
                  <div key={threat.id} className={styles.threatCard}>
                    <div className={styles.threatHeader}>
                      <h3 className={styles.threatName}>{threat.name}</h3>
                      <span
                        className={`${styles.severityBadge} ${styles[threat.severity]}`}
                      >
                        {threat.severity}
                      </span>
                    </div>
                    <div className={styles.threatSource}>{threat.source}</div>
                    <p className={styles.threatDescription}>{threat.description}</p>
                    <div className={styles.threatMeta}>
                      <div className={styles.metaItem}>
                        <div className={styles.metaLabel}>Threat Score</div>
                        <div className={styles.metaValue}>{threat.score.toFixed(1)}/10</div>
                      </div>
                      <div className={styles.metaItem}>
                        <div className={styles.metaLabel}>OWASP Category</div>
                        <div className={styles.metaValue}>{threat.owasp}</div>
                      </div>
                      <div className={styles.metaItem}>
                        <div className={styles.metaLabel}>Recommended Action</div>
                        <div className={styles.metaValue}>{threat.recommendation}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className={styles.actions}>
          <button className={styles.actionButton} onClick={() => navigate('/')}>
            <ArrowLeft size={16} />
            Back to Scanner
          </button>
          <button className={styles.actionButton} onClick={exportReport}>
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>
    </div>
  )
}
