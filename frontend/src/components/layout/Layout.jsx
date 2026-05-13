import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Moon, Sun, Shield, History, ScanLine } from 'lucide-react'
import { useTheme } from '../../App.jsx'
import s from './Layout.module.css'

const NAV = [
  { path: '/',        label: 'Scan',    Icon: ScanLine },
  { path: '/history', label: 'History', Icon: History  },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggle } = useTheme()

  return (
    <div className={s.root}>
      <header className={s.header}>
        <div className={s.brand} onClick={() => navigate('/')}>
          <Shield size={20} className={s.brandIcon} />
          <span>CyberScan</span>
          <span className={s.brandBadge}>AI</span>
        </div>

        <nav className={s.nav}>
          {NAV.map(({ path, label, Icon }) => (
            <button
              key={path}
              className={`${s.navBtn} ${location.pathname === path ? s.active : ''}`}
              onClick={() => navigate(path)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        <button className={s.themeBtn} onClick={toggle} title="Toggle theme">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </header>

      <main className={s.main}>
        <Outlet />
      </main>

      <footer className={s.footer}>
        <span>🌙 CyberScan — Real-Time URL Threat Detection · Powered by Grok + Gemini AI</span>
      </footer>
    </div>
  )
}
