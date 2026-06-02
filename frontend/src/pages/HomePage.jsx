import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { gsap } from 'gsap'
import { Zap, Shield, AlertTriangle, Globe, Lock, Eye, Cpu, Activity } from 'lucide-react'
import { runScan } from '../utils/scanner'
import ScanProgress from '../components/scanner/ScanProgress'
import styles from './HomePage.module.css'

/* ─── DATA ─────────────────────────────────────────────── */
const SOURCES = [
  { key: 'urlhaus',    label: 'URLhaus',       icon: <Shield size={12}/>    },
  { key: 'vt',         label: 'VirusTotal',    icon: <Eye size={12}/>       },
  { key: 'gsb',        label: 'Safe Browsing', icon: <Globe size={12}/>     },
  { key: 'phishtank',  label: 'PhishTank',     icon: <AlertTriangle size={12}/> },
  { key: 'urlscan',    label: 'URLScan.io',    icon: <Activity size={12}/>  },
  { key: 'ssl',        label: 'SSL Cert',      icon: <Lock size={12}/>      },
  { key: 'domain',     label: 'WHOIS/RDAP',    icon: <Cpu size={12}/>       },
]

const THREAT_FEED = [
  'MALWARE · phishing-kit-2024.zip · HIGH',
  'PHISHING · paypal-verify.xyz · CRITICAL',
  'C2 · 185.220.101.47:8080 · HIGH',
  'RANSOMWARE · crypt-spread.eu · CRITICAL',
  'TROJAN · update-flash-player.com · HIGH',
  'SPAM · bulk-mailer99.ru · MEDIUM',
  'BOTNET · tor-exit-node.net · HIGH',
]

/* ─── ORBITAL RING (SVG) ───────────────────────────────── */
function OrbitalRing({ r, duration, reverse, children }) {
  const ref = useRef(null)
  useEffect(() => {
    gsap.to(ref.current, {
      rotation: reverse ? -360 : 360,
      transformOrigin: '50% 50%',
      duration,
      ease: 'none',
      repeat: -1,
    })
  }, [duration, reverse])
  return (
    <div ref={ref} style={{
      position: 'absolute',
      width: r * 2, height: r * 2,
      top: '50%', left: '50%',
      marginLeft: -r, marginTop: -r,
      border: '1px solid rgba(99,102,241,0.18)',
      borderRadius: '50%',
      pointerEvents: 'none',
    }}>
      {children}
    </div>
  )
}

/* ─── LIVE THREAT TICKER ───────────────────────────────── */
function LiveTicker() {
  const trackRef = useRef(null)
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const items = [...THREAT_FEED, ...THREAT_FEED]
    el.innerHTML = items.map(t =>
      `<span class="${styles.tickerItem} ${t.includes('CRITICAL') ? styles.tickerCrit : t.includes('HIGH') ? styles.tickerHigh : styles.tickerMed}">${t}</span>`
    ).join('<span class="' + styles.tickerSep + '">  ◈  </span>')
    const totalW = el.scrollWidth / 2
    gsap.to(el, { x: -totalW, duration: THREAT_FEED.length * 5, ease: 'none', repeat: -1 })
    return () => gsap.killTweensOf(el)
  }, [])
  return (
    <div className={styles.ticker}>
      <span className={styles.tickerLive}>LIVE</span>
      <div className={styles.tickerMask}><div ref={trackRef} className={styles.tickerTrack} /></div>
    </div>
  )
}

/* ─── BEAM PARTICLE EFFECT ─────────────────────────────── */
function BeamEffect({ active }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = canvas.width = canvas.offsetWidth
    let H = canvas.height = canvas.offsetHeight
    const particles = []
    if (active) {
      for (let i = 0; i < 60; i++) {
        particles.push({
          x: Math.random() * W,
          y: H,
          vx: (Math.random() - 0.5) * 2,
          vy: -(Math.random() * 4 + 2),
          alpha: Math.random() * 0.8 + 0.2,
          r: Math.random() * 2 + 0.5,
          life: 1,
        })
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H)
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.012
        if (p.life <= 0) particles.splice(i, 1)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99,102,241,${p.life * p.alpha})`
        ctx.fill()
      })
      if (active && particles.length < 60) {
        particles.push({ x: Math.random() * W, y: H, vx: (Math.random() - 0.5) * 2, vy: -(Math.random() * 4 + 2), alpha: 0.8, r: Math.random() * 2 + 0.5, life: 1 })
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [active])
  return <canvas ref={canvasRef} className={styles.beamCanvas} />
}

/* ─── MAIN PAGE ────────────────────────────────────────── */
export default function HomePage() {
  const [target, setTarget]   = useState('')
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(null)
  const [sourceAnim, setSourceAnim] = useState(Array(SOURCES.length).fill('idle'))
  const navigate = useNavigate()
  const { user, authReady } = useOutletContext?.() || {}

  /* refs */
  const pageRef    = useRef(null)
  const titleRef   = useRef(null)
  const subtitleRef= useRef(null)
  const cardRef    = useRef(null)
  const inputRef   = useRef(null)
  const btnRef     = useRef(null)
  const orbRef     = useRef(null)
  const sourcesRef = useRef([])
  const scanLineRef= useRef(null)
  const hlRef      = useRef(null)
  const feedRef    = useRef([])
  const statsRef   = useRef([])
  const glowBorderRef = useRef(null)
  const tlMaster   = useRef(null)

  useEffect(() => {
    if (authReady && !user) navigate('/login')
  }, [authReady, user, navigate])

  /* ── MASTER ENTRANCE ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      tlMaster.current = gsap.timeline({ defaults: { ease: 'power4.out' } })

      /* 1. split-char title reveal */
      const titleEl = titleRef.current
      if (titleEl) {
        const text = titleEl.dataset.text || titleEl.textContent
        titleEl.innerHTML = text.split('').map(c =>
          c === ' ' ? '<span style="display:inline-block;width:.25em"> </span>'
                    : `<span class="${styles.char}" style="display:inline-block;opacity:0;transform:translateY(60px) rotateX(-80deg)">${c}</span>`
        ).join('')
        tlMaster.current.to(titleEl.querySelectorAll(`.${styles.char}`), {
          opacity: 1, y: 0, rotateX: 0,
          duration: 0.7,
          stagger: { each: 0.035, from: 'start' },
          ease: 'back.out(1.8)',
        }, 0.1)
      }

      /* 2. subtitle slide */
      tlMaster.current.fromTo(subtitleRef.current,
        { opacity: 0, y: 30, filter: 'blur(8px)' },
        { opacity: 1, y: 0,  filter: 'blur(0px)', duration: 0.8 },
        0.6
      )

      /* 3. card morph in */
      tlMaster.current.fromTo(cardRef.current,
        { opacity: 0, scale: 0.88, y: 48, rotationX: 12 },
        { opacity: 1, scale: 1,    y: 0,  rotationX: 0,  duration: 1, ease: 'expo.out' },
        0.8
      )

      /* 4. source nodes stagger */
      tlMaster.current.fromTo(sourcesRef.current,
        { opacity: 0, scale: 0, rotation: -90 },
        { opacity: 1, scale: 1, rotation: 0,  duration: 0.5, stagger: 0.06, ease: 'back.out(2.5)' },
        1.0
      )

      /* 5. stats counter up */
      tlMaster.current.fromTo(statsRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0,  duration: 0.5, stagger: 0.1 },
        1.2
      )

      /* 6. scan-line idle loop */
      if (scanLineRef.current) {
        gsap.to(scanLineRef.current, {
          scaleX: 1,
          opacity: [0, 1, 0],
          duration: 2.4,
          ease: 'sine.inOut',
          repeat: -1,
          delay: 1.6,
        })
      }

      /* 7. glow border rotate */
      if (glowBorderRef.current) {
        gsap.to(glowBorderRef.current, {
          rotation: 360,
          transformOrigin: '50% 50%',
          duration: 8,
          ease: 'none',
          repeat: -1,
        })
      }

    }, pageRef)

    return () => ctx.revert()
  }, [])

  /* ── SOURCE NODE IDLE WAVE ── */
  useEffect(() => {
    const tweens = sourcesRef.current.map((el, i) => {
      if (!el) return null
      return gsap.to(el, {
        y: -5, duration: 1.8,
        ease: 'sine.inOut',
        repeat: -1, yoyo: true,
        delay: i * 0.22,
      })
    })
    return () => tweens.forEach(t => t?.kill())
  }, [])

  /* ── SCAN BURST ANIMATION ── */
  const triggerScanBurst = useCallback(() => {
    /* ripple out from card */
    const ripple = document.createElement('div')
    ripple.className = styles.ripple
    cardRef.current?.appendChild(ripple)
    gsap.fromTo(ripple,
      { scale: 0, opacity: 0.7 },
      { scale: 4, opacity: 0, duration: 0.9, ease: 'power2.out',
        onComplete: () => ripple.remove() }
    )
    /* sources light up sequentially */
    sourcesRef.current.forEach((el, i) => {
      if (!el) return
      gsap.timeline({ delay: i * 0.12 })
        .to(el, { scale: 1.35, background: 'rgba(99,102,241,0.35)', duration: 0.2 })
        .to(el, { scale: 1,    background: 'rgba(99,102,241,0.10)', duration: 0.4 })
    })
    /* btn pulse */
    gsap.timeline()
      .to(btnRef.current, { scale: 0.92, duration: 0.1 })
      .to(btnRef.current, { scale: 1.06, duration: 0.25, ease: 'back.out(2)' })
      .to(btnRef.current, { scale: 1,    duration: 0.3 })
  }, [])

  const handleScan = async () => {
    const t = target.trim()
    if (!t) {
      gsap.fromTo(cardRef.current, { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' })
      inputRef.current?.focus()
      return
    }
    triggerScanBurst()
    setScanning(true)
    setProgress({ step: 'Initializing…', stepIdx: 0, pct: 0 })
    try {
      const result = await runScan(t, 'url', p => setProgress(p))
      window.scrollTo({ top: 0, behavior: 'instant' })
      navigate('/results', { state: { scan: result } })
    } catch (err) {
      setScanning(false)
      setProgress(null)
      alert('Scan failed: ' + err.message)
    }
  }

  /* input focus glow */
  const onFocus = () => gsap.to(hlRef.current, { opacity: 1, scaleX: 1, duration: 0.35, ease: 'power2.out' })
  const onBlur  = () => gsap.to(hlRef.current, { opacity: 0, scaleX: 0.6, duration: 0.4  })

  return (
    <div ref={pageRef} className={styles.page}>
      {scanning && progress && <ScanProgress progress={progress} />}

      {/* ── LIVE THREAT TICKER ── */}
      <LiveTicker />

      {/* ── HERO TITLE ── */}
      <div className={styles.heroBlock}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          <span>7 Intelligence Sources Active</span>
        </div>

        <h1
          ref={titleRef}
          data-text="Detect Threats. Instantly."
          className={styles.title}
          style={{ perspective: 600 }}
        >
          Detect Threats. Instantly.
        </h1>

        <p ref={subtitleRef} className={styles.subtitle}>
          Paste any URL — CyberScan cross-references malware databases,<br />
          phishing registries, AI models, and live DNS in under 10 seconds.
        </p>
      </div>

      {/* ── SCANNER CARD ── */}
      <div ref={cardRef} className={styles.scanCard} style={{ perspective: 1000 }}>

        {/* rotating glow border */}
        <div ref={glowBorderRef} className={styles.glowBorder} />

        {/* scan line */}
        <div ref={scanLineRef} className={styles.scanLine} />

        {/* window chrome */}
        <div className={styles.chrome}>
          <span className={styles.chromeDot} />
          <span className={styles.chromeDot} style={{ background: '#fbbf24' }} />
          <span className={styles.chromeDot} style={{ background: '#34d399' }} />
          <span className={styles.chromeTitle}>CYBERSCAN · THREAT ANALYSIS ENGINE · v3.0</span>
          <span className={styles.chromeLive}><span className={styles.liveDot} />LIVE</span>
        </div>

        {/* input row */}
        <div className={styles.inputZone}>
          <div className={styles.inputWrap}>
            <span className={styles.inputPrefix}>https://</span>
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              placeholder="paste-your-url-here.com"
              value={target.replace(/^https?:\/\//i, '')}
              onChange={e => setTarget('https://' + e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !scanning && handleScan()}
              onFocus={onFocus}
              onBlur={onBlur}
              disabled={scanning}
              autoComplete="off"
              spellCheck={false}
            />
            <div ref={hlRef} className={styles.inputHighlight} />
          </div>

          <button ref={btnRef} className={styles.scanBtn} onClick={handleScan} disabled={scanning}>
            <BeamEffect active={scanning} />
            <Zap size={17} className={styles.btnIcon} />
            <span>{scanning ? 'Analyzing…' : 'Scan Threat'}</span>
          </button>
        </div>

        {/* quick examples */}
        <div className={styles.examples}>
          <span className={styles.exLabel}>Try →</span>
          {['google.com', 'github.com', 'suspicious-login.xyz/verify'].map(e => (
            <button key={e} className={styles.exBtn} disabled={scanning}
              onClick={() => { setTarget('https://' + e); inputRef.current?.focus() }}>
              {e}
            </button>
          ))}
        </div>

        {/* orbital source nodes */}
        <div className={styles.sourcesOrbital}>
          <div className={styles.orbCenter}>
            <Shield size={18} className={styles.orbIcon} />
          </div>
          {SOURCES.map((s, i) => {
            const angle = (i / SOURCES.length) * 360
            const rad   = angle * Math.PI / 180
            const rx = 130, ry = 54
            const x = 50 + rx * Math.cos(rad) / 2.6
            const y = 50 + ry * Math.sin(rad) / 1.1
            return (
              <div
                key={s.key}
                ref={el => sourcesRef.current[i] = el}
                className={styles.sourceNode}
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}
              >
                {s.icon}
                <span>{s.label}</span>
                <span className={styles.nodeStatus} />
              </div>
            )
          })}
        </div>

      </div>

      {/* ── STATS STRIP ── */}
      <div className={styles.statsStrip}>
        {[
          { val: '7+',   label: 'Live Sources',   color: '#6366f1' },
          { val: '99%',  label: 'Detection Rate', color: '#22c55e' },
          { val: '<10s', label: 'Scan Speed',      color: '#f59e0b' },
          { val: '∞',    label: 'URLs Scanned',   color: '#ec4899' },
        ].map((s, i) => (
          <div key={s.label} ref={el => statsRef.current[i] = el} className={styles.stat}>
            <span className={styles.statVal} style={{ color: s.color }}>{s.val}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── FEATURE GRID ── */}
      <div className={styles.featureGrid}>
        {[
          { icon: <Shield size={22}/>,   title: 'Malware Detection',  desc: 'URLhaus abuse.ch + VirusTotal 70+ AV engines in parallel',  accent: '#6366f1' },
          { icon: <AlertTriangle size={22}/>, title: 'Phishing Intel',  desc: 'PhishTank confirmed registry + Google Safe Browsing API',   accent: '#ef4444' },
          { icon: <Lock size={22}/>,     title: 'SSL Deep Scan',      desc: 'Certificate chain, expiry, issuer validation, self-signed detection', accent: '#10b981' },
          { icon: <Cpu size={22}/>,      title: 'AI Dual-Engine',     desc: 'Grok + Gemini generate threat verdicts and answer follow-up questions', accent: '#8b5cf6' },
          { icon: <Globe size={22}/>,    title: 'Domain Intelligence',desc: 'RDAP domain age, registrar, IP geolocation, WHOIS metadata', accent: '#f59e0b' },
          { icon: <Activity size={22}/>, title: 'Live Page Scan',     desc: 'URLScan.io browser simulation with real screenshot capture', accent: '#06b6d4' },
        ].map((f, i) => (
          <FeatureCard key={f.title} {...f} index={i} />
        ))}
      </div>
    </div>
  )
}

/* ─── FEATURE CARD with 3D tilt ─── */
function FeatureCard({ icon, title, desc, accent, index }) {
  const ref = useRef(null)
  const glowRef = useRef(null)

  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const dx = (e.clientX - rect.left) / rect.width  - 0.5
    const dy = (e.clientY - rect.top)  / rect.height - 0.5
    gsap.to(el, { rotationY: dx * 14, rotationX: -dy * 14, scale: 1.04, duration: 0.4, ease: 'power2.out', transformPerspective: 600 })
    gsap.to(glowRef.current, { opacity: 0.6, x: dx * 30, y: dy * 30, duration: 0.4 })
  }
  const onLeave = () => {
    gsap.to(ref.current, { rotationY: 0, rotationX: 0, scale: 1, duration: 0.7, ease: 'elastic.out(1,0.4)' })
    gsap.to(glowRef.current, { opacity: 0, x: 0, y: 0, duration: 0.5 })
  }
  const onEnter = () => {
    gsap.fromTo(ref.current, { '--border-alpha': 0.12 }, { '--border-alpha': 0.4, duration: 0.3 })
  }

  return (
    <div
      ref={ref}
      className={styles.featureCard}
      style={{ '--accent': accent, willChange: 'transform', transformStyle: 'preserve-3d' }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseEnter={onEnter}
    >
      <div ref={glowRef} className={styles.featureGlow} style={{ background: `radial-gradient(circle, ${accent}33, transparent 70%)` }} />
      <div className={styles.featureIconWrap} style={{ background: `${accent}18`, border: `1px solid ${accent}33` }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className={styles.featureTitle}>{title}</div>
      <div className={styles.featureDesc}>{desc}</div>
      <div className={styles.featureAccentLine} style={{ background: accent }} />
    </div>
  )
}
