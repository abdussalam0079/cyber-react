import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, AlertCircle, CheckCircle, Shield, ExternalLink } from 'lucide-react'
import { saveToHistory } from '../utils/scanner'
import RiskGauge from '../components/results/RiskGauge'
import RiskBars from '../components/results/RiskBars'
import AIChat from '../components/results/AIChat'
import styles from './ResultsPage.module.css'

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }

export default function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const scan = location.state?.scan
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (scan) saveToHistory(scan)
    else navigate('/')
  }, [scan, navigate])

  if (!scan) return null

  const sortedThreats = [...(scan.threats || [])].sort(
    (a, b) => (SEV_ORDER[a.severity] ?? 4) - (SEV_ORDER[b.severity] ?? 4)
  )

  const exportReport = () => {
    const ev = scan.evidence || {}
    const lines = [
      '═══════════════════════════════════════════════════',
      '        CYBERSCAN THREAT DETECTION REPORT v3',
      '═══════════════════════════════════════════════════',
      '',
      `Target:       ${scan.target}`,
      `Scanned:      ${new Date(scan.timestamp).toLocaleString()}`,
      `Threat Score: ${scan.score.toFixed(1)}/10`,
      `Status:       ${scan.safe ? 'SAFE' : 'THREATS DETECTED'}`,
      '',
      'INTELLIGENCE SOURCES',
      `  URLhaus:             ${ev.urlhaus?.listed ? '⚠ LISTED' : '✓ Clean'}`,
      `  VirusTotal:          ${ev.virustotal ? ev.virustotal.ratio + ' flagged' : '— not checked'}`,
      `  Google Safe Browsing:${ev.gsb?.flagged ? ' ⚠ FLAGGED' : ' ✓ Clean'}`,
      `  PhishTank:           ${ev.phishtank?.phish ? '⚠ PHISHING' : '✓ Clean'}`,
      `  URLScan.io:          ${ev.urlscan?.malicious ? '⚠ Malicious' : ev.urlscan ? '✓ Clean' : '— not checked'}`,
      `  SSL:                 ${ev.ssl?.valid ? `✓ Valid (${ev.ssl.daysLeft}d left)` : '⚠ Invalid/Missing'}`,
      `  Domain Age:          ${ev.domain?.ageDays != null ? ev.domain.ageDays + ' days' : '— unknown'}`,
      '',
      'RISK SUMMARY',
      `  Critical: ${scan.summary.critical}  High: ${scan.summary.high}  Medium: ${scan.summary.medium}  Low: ${scan.summary.low}`,
      '',
      ...(scan.threats.length > 0
        ? ['DETECTED THREATS', ...scan.threats.flatMap(t => [
            '',
            `[${t.severity.toUpperCase()}] ${t.name}  (Score: ${t.score}/10)`,
            `  Source: ${t.source}`,
            `  ${t.description}`,
            `  OWASP: ${t.owasp}`,
            `  Action: ${t.recommendation}`,
          ])]
        : ['No threats detected.']),
      '',
      ...(scan.aiAnalysis?.text ? ['AI ANALYSIS', '', scan.aiAnalysis.text, ''] : []),
      '═══════════════════════════════════════════════════',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cyberscan-${scan.target.replace(/[^a-z0-9]/gi, '_').slice(0, 40)}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const ev = scan.evidence || {}

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Threat Analysis Report</h1>
            <p className={styles.timestamp}>
              {new Date(scan.timestamp).toLocaleString()} &nbsp;·&nbsp; Scan ID: {scan.id}
            </p>
          </div>
          <button className={styles.actionButton} onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> New Scan
          </button>
        </div>

        {/* Target + Score row */}
        <div className={styles.topRow}>
          <div className={styles.targetInfo}>
            <div className={styles.targetLabel}>
              {scan.safe ? <CheckCircle size={18} color="#16a34a" /> : <AlertCircle size={18} color="#dc2626" />}
              Target URL
            </div>
            <div className={styles.targetUrl}>{scan.target}</div>
            {ev.domain && (
              <div className={styles.domainMeta}>
                {ev.domain.ip && <span>IP: {ev.domain.ip}</span>}
                {ev.domain.ageDays != null && <span>Domain age: {ev.domain.ageDays} days</span>}
                {ev.urlscan?.country && <span>Country: {ev.urlscan.country}</span>}
                {ev.urlscan?.server && <span>Server: {ev.urlscan.server}</span>}
              </div>
            )}
          </div>
          <RiskGauge score={scan.score} />
        </div>

        {/* Intelligence Sources Panel */}
        <div className={styles.sourcesPanel}>
          <div className={styles.sourcesTitle}><Shield size={14} /> Intelligence Sources</div>
          <div className={styles.sourcesGrid}>
            <SourceBadge label="URLhaus"    status={ev.urlhaus?.listed ? 'danger' : ev.urlhaus ? 'safe' : 'skip'} detail={ev.urlhaus?.listed ? ev.urlhaus.threat : 'Clean'} />
            <SourceBadge label="VirusTotal" status={ev.virustotal?.malicious > 0 ? 'danger' : ev.virustotal ? 'safe' : 'skip'} detail={ev.virustotal ? ev.virustotal.ratio + ' flagged' : 'No key'} />
            <SourceBadge label="Safe Browsing" status={ev.gsb?.flagged ? 'danger' : ev.gsb ? 'safe' : 'skip'} detail={ev.gsb?.flagged ? ev.gsb.threats?.[0]?.type : ev.gsb ? 'Clean' : 'No key'} />
            <SourceBadge label="PhishTank"  status={ev.phishtank?.phish ? 'danger' : ev.phishtank ? 'safe' : 'skip'} detail={ev.phishtank?.phish ? 'Confirmed phish' : ev.phishtank ? 'Not listed' : 'Unavailable'} />
            <SourceBadge label="URLScan.io" status={ev.urlscan?.malicious ? 'danger' : ev.urlscan ? 'safe' : 'skip'} detail={ev.urlscan ? (ev.urlscan.malicious ? 'Malicious' : 'Clean') : 'No key'} />
            <SourceBadge label="SSL Cert"   status={ev.ssl?.valid && !ev.ssl?.expired ? (ev.ssl.expiringSoon ? 'warn' : 'safe') : ev.ssl ? 'danger' : 'skip'} detail={ev.ssl ? (ev.ssl.expired ? 'Expired' : ev.ssl.expiringSoon ? `${ev.ssl.daysLeft}d left` : `${ev.ssl.daysLeft}d left`) : 'N/A'} />
            <SourceBadge label="Domain Age" status={ev.domain?.ageDays != null ? (ev.domain.ageDays < 30 ? 'danger' : ev.domain.ageDays < 180 ? 'warn' : 'safe') : 'skip'} detail={ev.domain?.ageDays != null ? `${ev.domain.ageDays} days` : 'Unknown'} />
            <SourceBadge label="Patterns"   status={scan.threats.some(t => t.source === 'Pattern Analysis') ? 'warn' : 'safe'} detail={`${(scan.evidence?.patterns || []).length} flags`} />
          </div>
        </div>

        {/* URLScan screenshot */}
        {ev.urlscan?.screenshot && (
          <div className={styles.screenshotWrap}>
            <div className={styles.screenshotLabel}>
              <Eye size={13} /> URLScan.io Screenshot
              <a href={ev.urlscan.screenshot} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={12} />
              </a>
            </div>
            <img src={ev.urlscan.screenshot} alt="Page screenshot" className={styles.screenshot} />
          </div>
        )}

        {scan.safe ? (
          <div className={styles.safe}>
            <div className={styles.safeIcon}>✨</div>
            <p className={styles.safeText}>No threats detected</p>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              All {Object.values(scan.sources || {}).filter(Boolean).length} intelligence sources returned clean results.
            </p>
          </div>
        ) : (
          <>
            {/* Risk summary cards */}
            <div className={styles.riskSection}>
              <h2 className={styles.riskTitle}><AlertCircle size={16} /> Risk Summary</h2>
              <div className={styles.riskSummary}>
                {[['critical','🔴'],['high','🟠'],['medium','🟡'],['low','🟢']].map(([sev, icon]) => (
                  <div key={sev} className={`${styles.riskCard} ${styles[sev]}`}>
                    <div className={styles.riskNumber}>{scan.summary[sev]}</div>
                    <div className={styles.riskLabel}>{icon} {sev}</div>
                  </div>
                ))}
              </div>
            </div>

            <RiskBars score={scan.score} />

            {/* Threat cards */}
            <div className={styles.riskSection}>
              <h2 className={styles.riskTitle}><AlertCircle size={16} /> Detected Threats</h2>
              <div className={styles.threats}>
                {sortedThreats.map(threat => (
                  <div key={threat.id} className={`${styles.threatCard} ${styles['border_' + threat.severity]}`}>
                    <div className={styles.threatHeader}>
                      <h3 className={styles.threatName}>{threat.name}</h3>
                      <span className={`${styles.severityBadge} ${styles[threat.severity]}`}>
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
                        <div className={styles.metaLabel}>OWASP</div>
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

        {/* AI Analysis (static from scan) */}
        {scan.aiAnalysis?.text && (
          <div className={styles.aiStatic}>
            <div className={styles.aiStaticLabel}>⚡ AI Assessment ({scan.aiAnalysis.engine})</div>
            <p className={styles.aiStaticText}>{scan.aiAnalysis.text}</p>
          </div>
        )}

        {/* AI Chat */}
        <AIChat scan={{ ...scan, vulnerabilities: scan.threats }} />

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.actionButton} onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Back to Scanner
          </button>
          <button className={styles.actionButton} onClick={exportReport}>
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>
    </div>
  )
}

function SourceBadge({ label, status, detail }) {
  const colors = { safe: '#16a34a', danger: '#dc2626', warn: '#f97316', skip: '#9ca3af' }
  const icons  = { safe: '✓', danger: '✗', warn: '⚠', skip: '—' }
  const color  = colors[status]
  return (
    <div className={styles.sourceBadge} style={{ borderColor: color + '33' }}>
      <span style={{ color, fontWeight: 700, fontSize: '0.8rem' }}>{icons[status]}</span>
      <div>
        <div className={styles.sourceName}>{label}</div>
        <div className={styles.sourceDetail} style={{ color }}>{detail}</div>
      </div>
    </div>
  )
}
