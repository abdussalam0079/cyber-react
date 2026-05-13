import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Zap, AlertTriangle } from 'lucide-react'
import { callAI, loadAIConfig } from '../../utils/ai.js'
import styles from './VulnCard.module.css'

const SEV_COLOR = {
  critical: 'var(--red)',
  high:     'var(--orange)',
  medium:   'var(--yellow)',
  low:      'var(--neon)',
}

export default function VulnCard({ vuln, index, expanded, onToggle }) {
  const [aiText,  setAiText]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [aiError, setAiError] = useState(null)

  async function handleToggle() {
    onToggle()
    if (!expanded && !aiText && !loading) {
      const cfg = loadAIConfig()
      const hasKey = cfg.grokKey || cfg.geminiKey
      if (!hasKey) {
        setAiError('No API key — open ⚙ KEYS in the nav to add your Grok or Gemini key.')
        return
      }
      setLoading(true)
      setAiError(null)
      try {
        const prompt = `Explain this vulnerability clearly for a developer.

Vulnerability: ${vuln.name}
OWASP Category: ${vuln.owasp}
Severity: ${vuln.severity.toUpperCase()} (CVSS ${vuln.score})
Description: ${vuln.desc}
Related CVEs: ${vuln.cves.join(', ') || 'None'}

Provide:
1. WHY this is dangerous (2 sentences, plain English)
2. A real-world attack scenario (1–2 sentences)
3. The single most important fix step

Under 200 words. Be direct and practical.`
        const text = await callAI(prompt, { preferGemini: false })
        setAiText(text)
      } catch (e) {
        setAiError(e.message)
      }
      setLoading(false)
    }
  }

  const color = SEV_COLOR[vuln.severity]

  return (
    <motion.div
      className={`${styles.card} ${expanded ? styles.open : ''}`}
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      {/* ── CARD HEADER (always visible, clickable) ── */}
      <div className={styles.header} onClick={handleToggle}>
        <div className={styles.headerLeft}>
          <span className={`${styles.badge} ${styles[vuln.severity]}`}>
            {vuln.severity.toUpperCase()}
          </span>
          <span className={styles.owaspTag}>{vuln.owasp.split('–')[0].trim()}</span>
        </div>
        <div className={styles.headerCenter}>
          <div className={styles.name}>{vuln.name}</div>
          <div className={styles.desc}>{vuln.desc}</div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.score} style={{ color }}>
            <span className={styles.scoreNum}>{vuln.score}</span>
            <span className={styles.scoreLbl}>CVSS</span>
          </div>
          <div className={styles.chevron}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* CVE tags in header */}
      {vuln.cves.length > 0 && (
        <div className={styles.cveRow}>
          {vuln.cves.map(c => (
            <span key={c} className={styles.cveTag}>{c}</span>
          ))}
        </div>
      )}

      {/* ── EXPANDED BODY ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className={styles.body}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className={styles.bodyInner}>
              <div className={styles.grid}>
                {/* Left column */}
                <div>
                  {/* OWASP */}
                  <div className={styles.section}>
                    <div className={styles.sectionLbl}>◈ OWASP MAPPING</div>
                    <div className={styles.sectionTxt}>{vuln.owasp}</div>
                  </div>

                  {/* AI Explanation */}
                  <div className={styles.section}>
                    <div className={styles.sectionLbl}>
                      <Zap size={11} style={{ color: 'var(--neon)' }} />
                      AI ANALYSIS
                    </div>
                    {loading && (
                      <div className={styles.typing}>
                        <span /><span /><span />
                        <span className={styles.typingTxt}>Analyzing with AI...</span>
                      </div>
                    )}
                    {aiError && (
                      <div className={styles.aiError}>
                        <AlertTriangle size={12} />
                        {aiError}
                      </div>
                    )}
                    {aiText && (
                      <div className={styles.aiText}>{aiText}</div>
                    )}
                    {!loading && !aiText && !aiError && (
                      <div className={styles.aiPlaceholder}>Loading AI analysis...</div>
                    )}
                  </div>

                  {/* CVE Details */}
                  {vuln.cveDetails?.length > 0 && (
                    <div className={styles.section}>
                      <div className={styles.sectionLbl}>◈ CVE DETAILS</div>
                      {vuln.cveDetails.map(c => (
                        <div key={c.id} className={styles.cveDetail}>
                          <div className={styles.cveId}>{c.id} — CVSS {c.score}</div>
                          <div className={styles.cveDesc}>{c.desc}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right column — code fix */}
                <div>
                  <div className={styles.sectionLbl}>◈ REMEDIATION CODE</div>
                  <pre className={styles.codeBlock}><code>{vuln.fix}</code></pre>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
