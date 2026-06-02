import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/layout/Layout.jsx'
import HomePage from './pages/HomePage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import AssistantPage from './pages/AssistantPage.jsx'
import QuizPage from './pages/QuizPage.jsx'
import ToolsPage from './pages/ToolsPage.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"          element={<HomePage />} />
          <Route path="/results"   element={<ResultsPage />} />
          <Route path="/history"   element={<HistoryPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/quiz"      element={<QuizPage />} />
          <Route path="/tools"     element={<ToolsPage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/register"  element={<RegisterPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
