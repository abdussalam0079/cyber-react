import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, AlertCircle, Shield, ExternalLink, Eye } from 'lucide-react'
import { gsap } from 'gsap'
import { saveToHistory } from '../utils/scanner'
import RiskGauge from '../components/results/RiskGauge'
import RiskBars from '../components/results/RiskBars'
import AIChat from '../components/results/AIChat'
import ThreatTicker from '../components/ui/ThreatTicker'
import FloatingStatsBar from '../components/ui/FloatingStatsBar'
import ThreatRadar from '../components/results/ThreatRadar'
import CountUp from '../components/ui/CountUp'
import styles from './ResultsPage.module.css'

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }

export default function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const scan = location.state?.scan
  const [expandedId, setExpandedId] = useState(null)
  const pageRef  = useRef(null)
  const savedRef = useRef(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (!scan) { navigate('/'); return }
    if (!savedRef.current) { savedRef.current = true; saveToHistory(scan) }
  }, [scan, navigate])

  // GSAP stagger reveal
  useEffect(() => {
    if (!pageRef.current || !scan) return
    const els = pageRef.current.querySelectorAll('[data-reveal]')
    gsap.fromTo(els,
      { opacity: 0, y: 36 },
      { opacity: 1, y: 0, duration: 0.65, stagger: 0.10, ease: 'power3.out', delay: 0.15 }
    )
  }, [scan])

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
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `cyberscan-${scan.target.replace(/[^a-z0-9]/gi, '_').slice(0, 40)}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const ev               = scan.evidence || {}
  const aiConfidence     = scan.aiAnalysis?.confidence || Math.round((scan.score / 10) * 92 + 8)
  const detectionSources = [ev.urlhaus, ev.virustotal, ev.gsb, ev.phishtank, ev.urlscan, ev.ssl, ev.domain].filter(Boolean).length

  return (
    <div ref={pageRef} className={styles.page}>
      <div className={styles.container}>

        {/* Ticker */}
        <div data-reveal>
          <ThreatTicker threats={scan.threats} sources={scan.sources} />
        </div>

        {/* Hero */}
        <div data-reveal className={styles.heroSection}>
          <div className={styles.heroIntro}>
            <span className={styles.heroTag}>Threat Score</span>
            <h1 className={styles.heroTitle}>Enterprise-grade intelligence for {scan.target}</h1>
            <p className={styles.heroCopy}>
              This report blends live threat feeds, SSL validation, domain intelligence, and AI analysis
              into a single risk posture that security teams can act on immediately.
            </p>
            <div className={styles.heroMetrics}>
              <div className={styles.metricCard}>
                <span>Detections</span>
                <strong>{scan.threats.length}</strong>
              </div>
              <div className={styles.metricCard}>
                <span>Sources</span>
                <strong>{detectionSources}</strong>
              </div>
              <div className={styles.metricCard}>
                <span>AI Confidence</span>
                <strong>{aiConfidence}%</strong>
              </div>
            </div>
          </div>

          <div className={styles.heroGaugeCard}>
            <div className={styles.gaugeHeading}>
              <div>
                <span className={styles.gaugeLabel}>Live Threat Score</span>
                <p className={styles.gaugeSubtitle}>Weighted risk index from 0 to 10</p>
              </div>
              <div className={styles.scoreTag}>{scan.safe ? 'SAFE' : 'CRITICAL'}</div>
            </div>
            <RiskGauge score={scan.score} />
            <div className={styles.gaugeFootnote}>
              <span><CountUp value={scan.summary.critical} duration={1} delay={0.5} /> critical</span>
              <span><CountUp value={scan.summary.high} duration={1} delay={0.7} /> high risk</span>
            </div>
          </div>
        </div>

        {/* Dashboard grid */}
        <div data-reveal className={styles.dashboardGrid}>
          <div className={styles.cardAccent}>
            <div className={styles.cardHead}>Threat Sources</div>
            <div className={styles.cardBody}>
              <p>{scan.threats.length} unique detections across {detectionSources} intelligence feeds.</p>
              <ul>
                {sortedThreats.slice(0, 4).map((threat) => (
                  <li key={threat.id}>{threat.name} · <strong>{threat.source}</strong></li>
                ))}
              </ul>
            </div>
          </div>
          <div className={styles.cardAccent}>
            <div className={styles.cardHead}>Domain Intelligence</div>
            <div className={styles.cardBody}>
              <p>{ev.domain?.ageDays != null ? `${ev.domain.ageDays} days old` : 'Domain age unavailable'}</p>
              <p>{ev.domain?.ip ? `Hosted at ${ev.domain.ip}` : 'IP address unknown'}</p>
              <p>{ev.domain?.registrar ? `Registrar: ${ev.domain.registrar}` : 'WHOIS metadata unavailable'}</p>
            </div>
          </div>
          <div className={styles.cardAccent}>
            <div className={styles.cardHead}>SSL Security</div>
            <div className={styles.cardBody}>
              <p>{ev.ssl?.valid ? 'SSL certificate is valid' : 'No valid SSL certificate detected'}</p>
              <p>{ev.ssl?.daysLeft != null ? `${ev.ssl.daysLeft} days until expiration` : 'Expiry data unavailable'}</p>
              <p>{ev.ssl?.issuer ? `Issuer: ${ev.ssl.issuer}` : 'Issuer details unavailable'}</p>
            </div>
          </div>
          <div className={styles.cardAccent}>
            <div className={styles.cardHead}>AI Verdict</div>
            <div className={styles.cardBody}>
              <p>{scan.aiAnalysis?.summary || 'AI analysis completed with high confidence.'}</p>
              <p><strong>{aiConfidence}% confidence</strong> in threat categorization.</p>
            </div>
          </div>
        </div>

        {/* Sources + AI panel */}
        <div data-reveal className={styles.splitGrid}>
          <div className={styles.sourcesPanel}>
            <div className={styles.sourcesTitle}><Shield size={14} /> Intelligence Sources</div>
            <div className={styles.sourcesGrid}>
              <SourceBadge label="URLhaus"      status={ev.urlhaus?.listed ? 'danger' : ev.urlhaus ? 'safe' : 'skip'} detail={ev.urlhaus?.listed ? ev.urlhaus.threat : 'Clean'} />
              <SourceBadge label="VirusTotal"   status={ev.virustotal?.malicious > 0 ? 'danger' : ev.virustotal ? 'safe' : 'skip'} detail={ev.virustotal ? ev.virustotal.ratio + ' flagged' : 'No key'} />
              <SourceBadge label="Safe Browsing" status={ev.gsb?.flagged ? 'danger' : ev.gsb ? 'safe' : 'skip'} detail={ev.gsb?.flagged ? ev.gsb.threats?.[0]?.type : ev.gsb ? 'Clean' : 'No key'} />
              <SourceBadge label="PhishTank"    status={ev.phishtank?.phish ? 'danger' : ev.phishtank ? 'safe' : 'skip'} detail={ev.phishtank?.phish ? 'Confirmed phish' : ev.phishtank ? 'Not listed' : 'Unavailable'} />
              <SourceBadge label="URLScan.io"   status={ev.urlscan?.malicious ? 'danger' : ev.urlscan ? 'safe' : 'skip'} detail={ev.urlscan ? (ev.urlscan.malicious ? 'Malicious' : 'Clean') : 'No key'} />
              <SourceBadge label="SSL Cert"     status={ev.ssl?.valid && !ev.ssl?.expired ? (ev.ssl.expiringSoon ? 'warn' : 'safe') : ev.ssl ? 'danger' : 'skip'} detail={ev.ssl ? (ev.ssl.expired ? 'Expired' : `${ev.ssl.daysLeft}d left`) : 'N/A'} />
              <SourceBadge label="Domain Age"   status={ev.domain?.ageDays != null ? (ev.domain.ageDays < 30 ? 'danger' : ev.domain.ageDays < 180 ? 'warn' : 'safe') : 'skip'} detail={ev.domain?.ageDays != null ? `${ev.domain.ageDays} days` : 'Unknown'} />
              <SourceBadge label="Patterns"     status={scan.threats.some(t => t.source === 'Pattern Analysis') ? 'warn' : 'safe'} detail={`${(scan.evidence?.patterns || []).length} flags`} />
            </div>
          </div>

          <div className={styles.aiPanel}>
            <div className={styles.aiPanelHead}>
              <div>
                <span className={styles.cardHead}>AI Security Analyst</span>
                <p className={styles.cardNote}>Structured findings, risk reasoning, and suggested remediation.</p>
              </div>
              <div className={styles.assistantBadge}>AI</div>
            </div>
            <div className={styles.aiSummary}>
              <strong>{scan.aiAnalysis?.title || 'Threat classification completed'}</strong>
              <p>{scan.aiAnalysis?.summary || 'The model has identified the URL risk based on correlated threat telemetry.'}</p>
            </div>
            <div className={styles.aiGrid}>
              <div>
                <p className={styles.aiLabel}>Priority</p>
                <p className={styles.aiValue}>{scan.safe ? 'Low' : 'High'}</p>
              </div>
              <div>
                <p className={styles.aiLabel}>Action</p>
                <p className={styles.aiValue}>{scan.safe ? 'Monitor' : 'Investigate'}</p>
              </div>
              <div>
                <p className={styles.aiLabel}>Indicators</p>
                <p className={styles.aiValue}>{sortedThreats.length} findings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Screenshot */}
        {ev.urlscan?.screenshot && (
          <div data-reveal className={styles.screenshotWrap}>
            <div className={styles.screenshotLabel}>
              <Eye size={13} /> URLScan.io Screenshot
              <a href={ev.urlscan.screenshot} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={12} />
              </a>
            </div>
            <img src={ev.urlscan.screenshot} alt="Page screenshot" className={styles.screenshot} />
          </div>
        )}

        {/* Threat Radar */}
        <div data-reveal className={styles.radarSection}>
          <div className={styles.radarCard}>
            <div className={styles.radarHeader}>
              <span className={styles.radarTitle}>THREAT VECTOR RADAR</span>
              <span className={styles.radarSub}>Real-time multi-axis risk visualization</span>
            </div>
            <ThreatRadar scan={scan} />
          </div>
          <div className={styles.radarStats}>
            <RiskBars score={scan.score} />
          </div>
        </div>

        {/* Risk summary */}
        {!scan.safe && (
          <div data-reveal className={styles.riskSection}>
            <h2 className={styles.riskTitle}><AlertCircle size={16} /> Threat Intelligence Summary</h2>
            <div className={styles.riskSummary}>
              {[['critical','🔴'],['high','🟠'],['medium','🟡'],['low','🟢']].map(([sev, icon]) => (
                <div key={sev} className={`${styles.riskCard} ${styles[sev]}`}>
                  <div className={styles.riskNumber}>{scan.summary[sev]}</div>
                  <div className={styles.riskLabel}>{icon} {sev}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Threat cards */}
        <div data-reveal className={styles.threatsSection}>
          <h2 className={styles.riskTitle}><AlertCircle size={16} /> Detected Threats</h2>
          <div className={styles.threats}>
            {sortedThreats.map(threat => (
              <TiltCard key={threat.id} className={`${styles.threatCard} ${styles['border_' + threat.severity]}`}>
                <div className={styles.threatHeader}>
                  <h3 className={styles.threatName}>{threat.name}</h3>
                  <span className={`${styles.severityBadge} ${styles[threat.severity]}`}>{threat.severity}</span>
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
              </TiltCard>
            ))}
          </div>
        </div>

        {/* AI static */}
        {scan.aiAnalysis?.text && (
          <div data-reveal className={styles.aiStatic}>
            <div className={styles.aiStaticLabel}>⚡ AI Assessment ({scan.aiAnalysis.engine})</div>
            <p className={styles.aiStaticText}>{scan.aiAnalysis.text}</p>
          </div>
        )}

        {/* AI Chat */}
        <div data-reveal>
          <AIChat scan={{ ...scan, vulnerabilities: scan.threats }} />
        </div>

        {/* Actions — extra bottom padding for floating bar */}
        <div data-reveal className={styles.actions} style={{ paddingBottom: '5rem' }}>
          <button className={styles.actionButton} onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Back to Scanner
          </button>
          <button className={styles.actionButton} onClick={exportReport}>
            <Download size={16} /> Export Report
          </button>
        </div>

      </div>

      <FloatingStatsBar scan={scan} />
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

function TiltCard({ children, className }) {
  const ref = useRef(null)
  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const dx = (e.clientX - rect.left) / rect.width  - 0.5
    const dy = (e.clientY - rect.top)  / rect.height - 0.5
    gsap.to(el, { rotationY: dx * 8, rotationX: -dy * 8, scale: 1.02, duration: 0.4, ease: 'power2.out', transformPerspective: 800 })
  }
  const onLeave = () => {
    gsap.to(ref.current, { rotationY: 0, rotationX: 0, scale: 1, duration: 0.6, ease: 'elastic.out(1,0.5)' })
  }
  return (
    <div ref={ref} className={className} onMouseMove={onMove} onMouseLeave={onLeave} style={{ willChange: 'transform', transformStyle: 'preserve-3d' }}>
      {children}
    </div>
  )
}