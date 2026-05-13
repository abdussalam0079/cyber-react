import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, CheckCircle, AlertTriangle, Database, Shield, Wifi } from 'lucide-react'
import { saveToHistory } from '../utils/scanner.js'
import RiskGauge from '../components/results/RiskGauge.jsx'
import RiskBars from '../components/results/RiskBars.jsx'
import ThreatCard from '../components/results/ThreatCard.jsx'
import AIChat from '../components/results/AIChat.jsx'
import s from './ResultsPage.module.css'

export default function ResultsPage() {
  const location = useLocation()
  const navigate  = useNavigate()
  const scan      = location.state?.scan

  useEffect(() => {
    if (!scan) { navigate('/'); return }
    saveToHistory(scan)
  }, [])

  if (!scan) return null

  function exportReport() {
    const lines = [
      '═══════════════════════════════════════════════',
      '         CYBERSCAN THREAT DETECTION REPORT',
      '═══════════════════════════════════════════════',
      '',
      `Target  : ${scan.target}`,
      `Scanned : ${new Date(scan.timestamp).toLocaleString()}`,
      `Score   : ${scan.score.toFixed(1)} / 10`,
      `Status  : ${scan.safe ? 'SAFE' : 'THREATS DETECTED'}`,
      '',
      'RISK SUMMARY',
      `  Critical : ${scan.summary.critical}`,
      `  High     : ${scan.summary.high}`,
      `  Medium   : ${scan.summary.medium}`,
      `  Low      : ${scan.summary.low}`,
      '',
      'SOURCES CHECKED',
      `  URLhaus     : ${scan.sources?.urlhaus ? '✓' : '✗'}`,
      `  VirusTotal  : ${scan.sources?.virustotal ? '✓' : '✗'}`,
      `  URLScan.io  : ${scan.sources?.urlscan ? '✓' : '✗'}`,
      `  SSL Check   : ${scan.sources?.ssl ? '✓' : '✗'}`,
      `  Patterns    : ${scan.sources?.patterns ? '✓' : '✗'}`,
      '',
      ...(scan.threats.length > 0
        ? ['DETECTED THREATS', ...scan.threats.flatMap(t => [
            '',
            `[${t.severity.toUpperCase()}] ${t.name}`,
            `  Source : ${t.source}`,
            `  Score  : ${t.score}/10`,
            `  Detail : ${t.description}`,
            `  OWASP  : ${t.owasp}`,
            `  Action : ${t.recommendation}`,
          ])]
        : ['No threats detected.']),
      '',
      ...(scan.aiAnalysis?.text ? ['AI ANALYSIS', scan.aiAnalysis.text, `Engine: ${scan.aiAnalysis.engine}`] : []),
      '',
      '═══════════════════════════════════════════════',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `cyberscan-${scan.target.replace(/[^a-z0-9]/gi, '_').slice(0, 40)}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const ssl = scan.evidence?.ssl
  const vt  = scan.evidence?.virustotal
  const uh  = scan.evidence?.urlhaus

  return (
    <div className={s.page}>
      <div className={s.container}>

        {/* ── TOP BAR ── */}
        <div className={s.topBar}>
          <button className={s.backBtn} onClick={() => navigate('/')}>
            <ArrowLeft size={15} /> New Scan
          </button>
          <button className={s.exportBtn} onClick={exportReport}>
            <Download size={15} /> Export
          </button>
        </div>

        {/* ── TARGET ── */}
        <div className={s.targetBox}>
          <div className={scan.safe ? s.safeIcon : s.dangerIcon}>
            {scan.safe ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div className={s.targetInfo}>
            <div className={s.targetLabel}>TARGET URL</div>
            <div className={s.targetUrl}>{scan.target}</div>
          </div>
          <div className={s.timestamp}>
            {new Date(scan.timestamp).toLocaleString()}
          </div>
        </div>

        {/* ── GAUGE + BARS ── */}
        <div className={s.metricsRow}>
          <RiskGauge score={scan.score} />
          <RiskBars score={scan.score} />
        </div>

        {/* ── SUMMARY CARDS ── */}
        <div className={s.summaryGrid}>
          {[
            { label: 'Critical', count: scan.summary.critical, color: '#ef4444' },
            { label: 'High',     count: scan.summary.high,     color: '#f97316' },
            { label: 'Medium',   count: scan.summary.medium,   color: '#eab308' },
            { label: 'Low',      count: scan.summary.low,      color: '#22c55e' },
          ].map(({ label, count, color }) => (
            <div key={label} className={s.summaryCard} style={{ borderColor: `${color}33` }}>
              <div className={s.summaryNum} style={{ color }}>{count}</div>
              <div className={s.summaryLabel}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── SOURCES ── */}
        <div className={s.sourcesRow}>
          <div className={s.sectionLabel}><Database size={13} /> SOURCES CHECKED</div>
          <div className={s.sources}>
            {[
              { name: 'URLhaus',    ok: scan.sources?.urlhaus,    flag: uh?.listed },
              { name: 'VirusTotal', ok: scan.sources?.virustotal, flag: vt?.malicious > 0 },
              { name: 'URLScan',    ok: scan.sources?.urlscan,    flag: scan.evidence?.urlscan?.malicious },
              { name: 'SSL',        ok: scan.sources?.ssl,        flag: ssl && (!ssl.valid || ssl.expired) },
              { name: 'Patterns',   ok: scan.sources?.patterns,   flag: scan.evidence?.patterns?.length > 0 },
            ].map(({ name, ok, flag }) => (
              <div key={name} className={`${s.source} ${!ok ? s.sourceOff : flag ? s.sourceWarn : s.sourceOk}`}>
                <span className={s.sourceDot} />
                {name}
              </div>
            ))}
          </div>
        </div>

        {/* ── SSL DETAIL ── */}
        {ssl && (
          <div className={s.sslBox}>
            <div className={s.sectionLabel}><Shield size={13} /> SSL CERTIFICATE</div>
            <div className={s.sslGrid}>
              <div className={s.sslItem}>
                <div className={s.sslKey}>Status</div>
                <div className={s.sslVal} style={{ color: ssl.valid ? '#22c55e' : '#ef4444' }}>
                  {ssl.expired ? 'Expired' : ssl.valid ? 'Valid' : 'Invalid'}
                </div>
              </div>
              <div className={s.sslItem}>
                <div className={s.sslKey}>Issuer</div>
                <div className={s.sslVal}>{ssl.issuer || '—'}</div>
              </div>
              <div className={s.sslItem}>
                <div className={s.sslKey}>Expires</div>
                <div className={s.sslVal} style={{ color: ssl.expiringSoon ? '#eab308' : 'inherit' }}>
                  {ssl.expiresAt ? new Date(ssl.expiresAt).toLocaleDateString() : '—'}
                  {ssl.daysLeft !== null && ` (${ssl.daysLeft}d)`}
                </div>
              </div>
              <div className={s.sslItem}>
                <div className={s.sslKey}>Subject</div>
                <div className={s.sslVal}>{ssl.subject || '—'}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── SAFE BANNER ── */}
        {scan.safe && (
          <div className={s.safeBanner}>
            <CheckCircle size={22} />
            <div>
              <div className={s.safeTitle}>No Threats Detected</div>
              <div className={s.safeSub}>This URL passed all security checks.</div>
            </div>
          </div>
        )}

        {/* ── THREATS ── */}
        {scan.threats.length > 0 && (
          <div className={s.section}>
            <div className={s.sectionLabel}>
              <AlertTriangle size={13} />
              DETECTED THREATS ({scan.threats.length})
            </div>
            <div className={s.threats}>
              {scan.threats.map((t, i) => (
                <ThreatCard key={t.id} threat={t} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── AI CHAT ── */}
        <div className={s.section}>
          <div className={s.sectionLabel}><Wifi size={13} /> AI ANALYSIS & CHAT</div>
          <AIChat scan={scan} />
        </div>

      </div>
    </div>
  )
}
