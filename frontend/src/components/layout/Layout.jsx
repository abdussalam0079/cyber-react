import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import styles from './Layout.module.css'

const navItems = [
  { path: '/', label: 'Scan' },
  { path: '/history', label: 'History' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()

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
        </nav>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <span>CyberScan &mdash; Real-Time URL Threat Intelligence</span>
      </footer>
    </div>
  )
}
