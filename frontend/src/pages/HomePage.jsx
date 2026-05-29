import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Globe, Zap, Shield, Eye, Lock } from 'lucide-react'
import { runScan } from '../utils/scanner'
import ScanProgress from '../components/scanner/ScanProgress'
import styles from './HomePage.module.css'

const FEATURES = [
  { icon: <Shield size={16} />, label: 'URLhaus + VirusTotal' },
  { icon: <Eye size={16} />,    label: 'Google Safe Browsing' },
  { icon: <Lock size={16} />,   label: 'SSL + PhishTank + WHOIS' },
]

export default function HomePage() {
  const [target,   setTarget]   = useState('')
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(null)
  const navigate = useNavigate()
  const { user, authReady } = useOutletContext()

  useEffect(() => {
    if (authReady && !user) {
      navigate('/login')
    }
  }, [authReady, user, navigate])

  const handleScan = async () => {
    const t = target.trim()
    if (!t) return
    setScanning(true)
    setProgress({ step: 'Initializing...', stepIdx: 0, pct: 0 })
    try {
      const result = await runScan(t, 'url', p => setProgress(p))
      navigate('/results', { state: { scan: result } })
    } catch (err) {
      setScanning(false)
      setProgress(null)
      alert('Scan failed: ' + err.message)
    }
  }

  return (
    <div className={styles.page}>
      {scanning && progress && <ScanProgress progress={progress} />}

      <div className={styles.card}>
        <div className={styles.hero}>
          <div className={styles.overline}>
            <Globe size={13} /> Real-Time Threat Intelligence
          </div>
          <h1 className={styles.title}>URL Threat Scanner</h1>
          <p className={styles.subtitle}>
            Scan any URL against 7+ live threat intelligence sources — malware databases,
            phishing registries, SSL analysis, domain age, and AI-powered assessment.
          </p>
        </div>

        <div className={styles.checks}>
          {FEATURES.map(f => (
            <div key={f.label} className={styles.checkItem}>
              {f.icon} {f.label}
            </div>
          ))}
        </div>

        <div>
          <label className={styles.label}>Target URL</label>
          <input
            type="text"
            className={styles.input}
            placeholder="https://example.com or example.com"
            value={target}
            onChange={e => setTarget(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !scanning && handleScan()}
            disabled={scanning}
          />
        </div>

        <button
          className={styles.scanButton}
          onClick={handleScan}
          disabled={!target.trim() || scanning}
        >
          <Zap size={18} />
          {scanning ? 'Scanning...' : 'Start Threat Scan'}
        </button>
      </div>
    </div>
  )
}
