import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import styles from './Layout.module.css'
import ThreatParticles from '../ui/ThreatParticles'
import CursorGlow from '../ui/CursorGlow'

function Logo({ theme }) {
  const c1 = theme === 'light' ? '#7c3aed' : '#00E5FF'
  const c2 = theme === 'light' ? '#a78bfa' : '#6366F1'
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:8,cursor:'pointer'}}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#g)" />
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0" stopColor={c1} />
            <stop offset="1" stopColor={c2} />
          </linearGradient>
        </defs>
      </svg>
      <strong style={{fontSize:18,letterSpacing:-0.02}} aria-hidden>CyberScan</strong>
    </div>
  )
}

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [compactNav, setCompactNav] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('cyberscan-theme') || 'dark'
    setTheme(savedTheme)
    document.documentElement.dataset.theme = savedTheme
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('cyberscan-theme', theme)
  }, [theme])

  useEffect(() => {
    const hash = window.location.hash?.slice(1)
    if (location.pathname === '/' && hash) {
      const element = document.getElementById(hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [location.pathname, location.hash])

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goToSection = (sectionId) => {
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        window.history.replaceState(null, '', `#${sectionId}`)
        return
      }
    }
    navigate(`/#${sectionId}`)
  }

  async function refreshUser() {
    try {
      const res = await fetch('/auth/me', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to check session')
      const { user } = await res.json()
      setUser(user)
    } catch {
      setUser(null)
    } finally {
      setAuthReady(true)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const handleLogout = async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
    navigate('/login')
  }

  return (
    <div className={styles.root}>
      <ThreatParticles active />
      {theme === 'dark' && <CursorGlow />}
      <a href="#main-content" className={styles.skipLink}>Skip to content</a>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div
          className={styles.left}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/')}
          onClick={() => navigate('/')}
          aria-label="Go to home"
        >
          <Logo theme={theme} />
        </div>

        <nav id="main-navigation" className={styles.center} role="navigation" aria-label="Main">
          <button className={styles.linkButton} onClick={() => navigate('/quiz')}>Quiz</button>
          <button className={styles.linkButton} onClick={() => navigate('/tools')}>Tools</button>
          <button className={styles.linkButton} onClick={() => goToSection('tech')}>Technology</button>
        </nav>

        <nav className={styles.right} role="navigation" aria-label="User">
          <button className={styles.linkButton} onClick={() => navigate('/history')}>History</button>
          <button className={styles.linkButton} onClick={() => navigate('/assistant')}>Chat Bot</button>
          {authReady && user && (
            <button className={styles.linkButton} onClick={handleLogout}>Logout</button>
          )}
          <button
            className={styles.themeToggle}
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </nav>
      </header>

      <main id="main-content" className={styles.main}>
        <Outlet context={{ user, authReady, refreshUser }} />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerGlow} />
        <span>CyberScan &mdash; Real-Time URL Threat Intelligence &mdash; v3.0</span>
        <span className={styles.footerRight}>7 sources · AI-powered · Free</span>
      </footer>
    </div>
  )
}
