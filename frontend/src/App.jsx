import { createContext, useContext, useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import HomePage from './pages/HomePage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'

export const ThemeCtx = createContext(null)
export function useTheme() { return useContext(ThemeCtx) }

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('cs_theme') || 'dark')

  const toggle = useCallback(() => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      localStorage.setItem('cs_theme', next)
      if (next === 'light') document.documentElement.setAttribute('data-theme', 'light')
      else document.documentElement.removeAttribute('data-theme')
      return next
    })
  }, [])

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeCtx.Provider>
  )
}
