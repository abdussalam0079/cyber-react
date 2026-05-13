import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, Code2, Zap } from 'lucide-react'
import { runScan } from '../utils/scanner'
import styles from './HomePage.module.css'

export default function HomePage() {
  const [mode, setMode] = useState('url')
  const [target, setTarget] = useState('')
  const [scanning, setScanning] = useState(false)
  const navigate = useNavigate()

  const handleScan = async () => {
    if (!target.trim()) return

    setScanning(true)
    try {
      const result = await runScan(target, mode)
      navigate('/results', { state: { scan: result } })
    } catch (err) {
      alert('Scan failed: ' + err.message)
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.hero}>
          <div className={styles.overline}>🌙 Real-Time Threat Detection</div>
          <h1 className={styles.title}>Scan for Security Threats</h1>
          <p className={styles.subtitle}>
            Analyze URLs for malware, phishing, and security vulnerabilities using real threat intelligence APIs.
          </p>
        </div>

        <div className={styles.selector}>
          <button
            className={`${styles.option} ${mode === 'url' ? styles.active : ''}`}
            onClick={() => setMode('url')}
          >
            <Globe size={18} />
            URL Scan
          </button>
          <button
            className={`${styles.option} ${mode === 'code' ? styles.active : ''}`}
            onClick={() => setMode('code')}
          >
            <Code2 size={18} />
            Code Scan
          </button>
        </div>

        <div>
          <label className={styles.label}>
            {mode === 'url' ? 'Target URL' : 'Source Code'}
          </label>
          {mode === 'url' ? (
            <input
              type="text"
              className={styles.input}
              placeholder="https://example.com"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleScan()}
            />
          ) : (
            <textarea
              className={styles.textarea}
              placeholder="Paste your code here..."
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          )}
        </div>

        <button
          className={styles.scanButton}
          onClick={handleScan}
          disabled={!target.trim() || scanning}
        >
          <Zap size={18} />
          {scanning ? 'Scanning...' : 'Start Scan'}
        </button>
      </div>
    </div>
  )
}
