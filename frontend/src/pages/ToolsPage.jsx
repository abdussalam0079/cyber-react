import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Lock, Hash, Code, Copy, Check, RefreshCw, Eye, EyeOff } from 'lucide-react'
import styles from './ToolsPage.module.css'

/* ── Password Strength Tool ── */
function PasswordTool() {
  const [pwd, setPwd]       = useState('')
  const [show, setShow]     = useState(false)
  const barRef              = useRef(null)
  const scoreRef            = useRef(null)

  const checks = [
    { label: 'At least 8 characters', ok: pwd.length >= 8 },
    { label: 'Uppercase letter',      ok: /[A-Z]/.test(pwd) },
    { label: 'Lowercase letter',      ok: /[a-z]/.test(pwd) },
    { label: 'Number',                ok: /\d/.test(pwd) },
    { label: 'Special character',     ok: /[^a-zA-Z0-9]/.test(pwd) },
    { label: 'Length > 14',           ok: pwd.length > 14 },
  ]

  const score = checks.filter(c => c.ok).length
  const pct   = (score / checks.length) * 100
  const label = score <= 1 ? 'Very Weak' : score <= 2 ? 'Weak' : score <= 3 ? 'Fair' : score <= 4 ? 'Strong' : score <= 5 ? 'Very Strong' : 'Unbreakable'
  const color = score <= 1 ? '#ef4444' : score <= 2 ? '#f97316' : score <= 3 ? '#f59e0b' : score <= 4 ? '#22c55e' : '#06b6d4'

  useEffect(() => {
    if (barRef.current)  gsap.to(barRef.current,  { width: `${pct}%`, background: color, duration: 0.5, ease: 'power2.out' })
    if (scoreRef.current) gsap.fromTo(scoreRef.current, { scale: 1.3 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' })
  }, [score, pct, color])

  function generate() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+'
    const p = Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setPwd(p)
  }

  return (
    <div className={styles.tool}>
      <div className={styles.toolHeader}>
        <Lock size={18} className={styles.toolIcon} style={{ color: '#22c55e' }} />
        <span className={styles.toolTitle}>Password Strength Analyzer</span>
      </div>

      <div className={styles.inputRow}>
        <input
          type={show ? 'text' : 'password'}
          className={styles.toolInput}
          placeholder="Type or generate a password…"
          value={pwd}
          onChange={e => setPwd(e.target.value)}
        />
        <button className={styles.iconBtn} onClick={() => setShow(s => !s)} title="Toggle visibility">
          {show ? <EyeOff size={15}/> : <Eye size={15}/>}
        </button>
        <button className={styles.iconBtn} onClick={generate} title="Generate strong password">
          <RefreshCw size={15}/>
        </button>
      </div>

      <div className={styles.strengthTrack}>
        <div ref={barRef} className={styles.strengthFill} style={{ width: '0%' }} />
      </div>

      <div className={styles.strengthLabel}>
        <span ref={scoreRef} style={{ color, fontWeight: 800 }}>{label}</span>
        <span className={styles.strengthScore}>{score}/6</span>
      </div>

      <div className={styles.checks}>
        {checks.map(c => (
          <div key={c.label} className={`${styles.check} ${c.ok ? styles.checkOk : ''}`}>
            <span>{c.ok ? '✓' : '○'}</span>
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Hash Generator ── */
async function sha256(msg) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}
async function sha1(msg) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(msg))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}

function HashTool() {
  const [input,   setInput]   = useState('')
  const [hashes,  setHashes]  = useState({ sha256: '', sha1: '', b64: '' })
  const [copied,  setCopied]  = useState(null)
  const resultRef = useRef(null)

  useEffect(() => {
    if (!input) { setHashes({ sha256: '', sha1: '', b64: '' }); return }
    const timer = setTimeout(async () => {
      const [h256, h1] = await Promise.all([sha256(input), sha1(input)])
      const b64 = btoa(unescape(encodeURIComponent(input)))
      setHashes({ sha256: h256, sha1: h1, b64 })
      if (resultRef.current)
        gsap.fromTo(resultRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 })
    }, 300)
    return () => clearTimeout(timer)
  }, [input])

  function copy(val, key) {
    navigator.clipboard.writeText(val)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className={styles.tool}>
      <div className={styles.toolHeader}>
        <Hash size={18} className={styles.toolIcon} style={{ color: '#8b5cf6' }} />
        <span className={styles.toolTitle}>Hash Generator</span>
      </div>

      <textarea
        className={styles.toolTextarea}
        placeholder="Type anything to hash it instantly…"
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={3}
      />

      {input && (
        <div ref={resultRef} className={styles.hashResults}>
          {[
            { key: 'sha256', label: 'SHA-256', val: hashes.sha256 },
            { key: 'sha1',   label: 'SHA-1',   val: hashes.sha1   },
            { key: 'b64',    label: 'Base64',   val: hashes.b64    },
          ].map(h => (
            <div key={h.key} className={styles.hashRow}>
              <span className={styles.hashLabel}>{h.label}</span>
              <span className={styles.hashVal}>{h.val?.slice(0,32)}{h.val?.length > 32 ? '…' : ''}</span>
              <button className={styles.copyBtn} onClick={() => copy(h.val, h.key)}>
                {copied === h.key ? <Check size={12} style={{ color: '#22c55e' }}/> : <Copy size={12}/>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── URL Encoder/Decoder ── */
function UrlTool() {
  const [input,  setInput]  = useState('')
  const [mode,   setMode]   = useState('encode')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)
  const outRef = useRef(null)

  useEffect(() => {
    if (!input) { setOutput(''); return }
    try {
      const result = mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input)
      setOutput(result)
      if (outRef.current)
        gsap.fromTo(outRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 })
    } catch { setOutput('⚠ Invalid input for decoding') }
  }, [input, mode])

  function copy() {
    navigator.clipboard.writeText(output)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={styles.tool}>
      <div className={styles.toolHeader}>
        <Code size={18} className={styles.toolIcon} style={{ color: '#06b6d4' }} />
        <span className={styles.toolTitle}>URL Encoder / Decoder</span>
      </div>

      <div className={styles.modeTabs}>
        {['encode', 'decode'].map(m => (
          <button key={m} className={`${styles.modeTab} ${mode === m ? styles.modeActive : ''}`} onClick={() => setMode(m)}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <textarea
        className={styles.toolTextarea}
        placeholder={mode === 'encode' ? 'Paste a URL to encode…' : 'Paste encoded URL to decode…'}
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={3}
      />

      {output && (
        <div ref={outRef} className={styles.outputBox}>
          <div className={styles.outputLabel}>
            {mode === 'encode' ? 'Encoded' : 'Decoded'}
            <button className={styles.copyBtn} onClick={copy}>
              {copied ? <Check size={12} style={{ color: '#22c55e' }}/> : <Copy size={12}/>}
            </button>
          </div>
          <div className={styles.outputText}>{output}</div>
        </div>
      )}
    </div>
  )
}

/* ── Main Page ── */
export default function ToolsPage() {
  const pageRef = useRef(null)
  const toolRefs = useRef([])

  useEffect(() => {
    gsap.fromTo(pageRef.current,
      { opacity: 0 }, { opacity: 1, duration: 0.4 }
    )
    gsap.fromTo(toolRefs.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out', delay: 0.15 }
    )
  }, [])

  return (
    <div ref={pageRef} className={styles.page}>
      <div className={styles.header}>
        <div className={styles.badge}>🛠 CYBER TOOLKIT</div>
        <h1 className={styles.title}>Security Tools</h1>
        <p className={styles.subtitle}>Interactive utilities for security analysis — all run locally in your browser.</p>
      </div>

      <div className={styles.grid}>
        <div ref={el => toolRefs.current[0] = el}><PasswordTool /></div>
        <div ref={el => toolRefs.current[1] = el}><HashTool /></div>
        <div ref={el => toolRefs.current[2] = el}><UrlTool /></div>
      </div>
    </div>
  )
}
