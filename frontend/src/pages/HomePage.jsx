import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Zap, Globe, Lock, AlertTriangle, CheckCircle } from 'lucide-react'
import { runScan } from '../utils/scanner.js'
import ScanProgress from '../components/scanner/ScanProgress.jsx'
import s from './HomePage.module.css'

const FEATURES = [
  { icon: Globe,         label: 'URLhaus Database',   desc: 'Real-time malware & phishing lookup' },
  { icon: Lock,          label: 'SSL Analysis',        desc: 'Certificate validity & expiry check'  },
  { icon: AlertTriangle, label: 'Pattern Detection',   desc: '10+ suspicious URL pattern checks'   },
  { icon: Zap,           label: 'Grok + Gemini AI',    desc: 'Dual AI threat analysis & chat'       },
]

const STEPS_COUNT = 6

export default function HomePage() {
  const [url, setUrl]         = useState('')
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState({ pct: 0, stepIdx: 0 })
  const [error, setError]     = useState('')
  const navigate = useNavigate()

  function simulateProgress(resolve) {
    let step = 0
    const steps = [8, 22, 40, 58, 75, 90]
    const iv = setInterval(() => {
      if (step < steps.length) {
        setProgress({ pct: steps[step], stepIdx: step })
        step++
      } else {
        clearInterval(iv)
        resolve()
      }
    }, 600)
    return iv
  }

  async function handleScan() {
    const target = url.trim()
    if (!target) return
    setError('')
    setScanning(true)
    setProgress({ pct: 0, stepIdx: 0 })

    let iv
    try {
      await new Promise(r => { iv = simulateProgress(r) })
      const result = await runScan(target)
      setProgress({ pct: 100, stepIdx: STEPS_COUNT })
      await new Promise(r => setTimeout(r, 400))
      navigate('/results', { state: { scan: result } })
    } catch (e) {
      clearInterval(iv)
      setError(e.message)
      setScanning(false)
    }
  }

  return (
    <div className={s.page}>
      {scanning && <ScanProgress pct={progress.pct} stepIdx={progress.stepIdx} />}

      <div className={s.hero}>
        <div className={s.moonBadge}>
          <span className={s.moonIcon}>🌙</span>
          Real-Time Threat Detection
        </div>
        <h1 className={s.title}>
          Scan Any URL for<br />
          <span className={s.gradient}>Security Threats</span>
        </h1>
        <p className={s.sub}>
          Multi-source threat intelligence — URLhaus, SSL analysis, pattern detection,
          and dual AI analysis with Grok + Gemini.
        </p>
      </div>

      <div className={s.card}>
        <div className={s.inputWrap}>
          <Globe size={18} className={s.inputIcon} />
          <input
            className={s.input}
            type="text"
            placeholder="https://example.com or example.com"
            value={url}
            onChange={e => { setUrl(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleScan()}
            disabled={scanning}
            autoFocus
          />
        </div>

        {error && (
          <div className={s.error}>
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        <button
          className={s.scanBtn}
          onClick={handleScan}
          disabled={!url.trim() || scanning}
        >
          <Shield size={18} />
          {scanning ? 'Scanning...' : 'Scan URL'}
        </button>

        <div className={s.hint}>
          Try: <span onClick={() => setUrl('http://malware.testing.google.test/testing/malware/')}>malware test</span>
          {' · '}
          <span onClick={() => setUrl('https://github.com')}>safe site</span>
        </div>
      </div>

      <div className={s.features}>
        {FEATURES.map(({ icon: Icon, label, desc }) => (
          <div key={label} className={s.feature}>
            <div className={s.featureIcon}><Icon size={18} /></div>
            <div>
              <div className={s.featureLabel}>{label}</div>
              <div className={s.featureDesc}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
