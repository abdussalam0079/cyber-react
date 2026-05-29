import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import styles from './Layout.module.css'

const navItems = [
  { path: '/', label: 'Scan' },
  { path: '/history', label: 'History' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('cyberscan-theme')
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.dataset.theme = savedTheme
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('cyberscan-theme', theme)
  }, [theme])

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
      <header className={styles.header}>
        <div className={styles.brand} onClick={() => navigate('/')}>CyberScan</div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={location.pathname === item.path ? styles.active : ''}
            >
              {item.label}
            </button>
          ))}
          {authReady && (
            user ? (
              <>
                <button onClick={handleLogout}>Logout</button>
                <button onClick={() => navigate('/history')}>
                  {user.email}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')}>
                  Login
                </button>
                <button onClick={() => navigate('/register')}>
                  Register
                </button>
              </>
            )
          )}
          <button
            className={styles.themeToggle}
            type="button"
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        <Outlet context={{ user, authReady, refreshUser }} />
      </main>

      <footer className={styles.footer}>
        <span>CyberScan &mdash; Real-Time URL Threat Intelligence</span>
      </footer>
    </div>
  )
}
