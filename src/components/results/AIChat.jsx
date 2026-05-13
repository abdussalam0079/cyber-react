import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Cpu } from 'lucide-react'
import { callAI, loadAIConfig, engineLabel } from '../../utils/ai.js'
import styles from './AIChat.module.css'

const QUICK_QUESTIONS = [
  'Which vuln is most urgent?',
  'How do I fix the SQL injection?',
  'What\'s my overall risk level?',
  'Explain broken access control',
]

const ENGINE_BADGE = {
  grok:   { icon: '𝕏', label: 'GROK',   color: '#e0e0e0' },
  gemini: { icon: '✦', label: 'GEMINI', color: '#4285f4' },
  dual:   { icon: '⚡', label: 'DUAL',   color: 'var(--neon)' },
}

export default function AIChat({ scan }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Scan complete for "${scan.target.slice(0, 45)}${scan.target.length > 45 ? '…' : ''}". Found ${scan.vulnerabilities.length} vulnerabilities — ${scan.summary.critical} critical. Ask me anything about the results.`,
    },
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(q) {
    const question = (q || input).trim()
    if (!question || loading) return
    setInput('')

    const cfg = loadAIConfig()
    const hasKey = cfg.grokKey || cfg.geminiKey

    setMessages(m => [...m, { role: 'user', text: question }])

    if (!hasKey) {
      setMessages(m => [...m, {
        role: 'ai',
        text: '⚠ No API key configured. Click ⚙ KEYS in the nav bar to add your Grok or Gemini key.',
        isError: true,
      }])
      return
    }

    setLoading(true)
    try {
      const prompt = `You are CYBERSCAN AI, a cybersecurity assistant. Answer in 2–4 sentences. Be practical and direct.

Scan context: Target "${scan.target}" — ${scan.vulnerabilities.length} vulnerabilities found: ${scan.vulnerabilities.map(v => v.name).join(', ')}. Overall risk score: ${scan.score}/10.

User question: ${question}`

      const answer = await callAI(prompt, { preferGemini: true })
      setMessages(m => [...m, { role: 'ai', text: answer }])
    } catch (e) {
      setMessages(m => [...m, { role: 'ai', text: `✕ ${e.message}`, isError: true }])
    }
    setLoading(false)
  }

  const cfg   = loadAIConfig()
  const badge = ENGINE_BADGE[cfg.engine] || ENGINE_BADGE.grok

  return (
    <div className={styles.box}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.aiLabel}>
          <div className={styles.aiDot} />
          <Cpu size={13} />
          CYBERSCAN AI ASSISTANT
        </div>
        <div className={styles.engineBadge} style={{ color: badge.color, borderColor: `${badge.color}44` }}>
          {badge.icon} {badge.label}
        </div>
        <div className={styles.quickBtns}>
          {QUICK_QUESTIONS.map(q => (
            <button key={q} className={styles.quickBtn} onClick={() => send(q)}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              className={`${styles.msg} ${m.role === 'user' ? styles.userMsg : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className={`${styles.avatar} ${m.role === 'user' ? styles.userAvatar : styles.aiAvatar}`}>
                {m.role === 'ai' ? 'AI' : 'ME'}
              </div>
              <div className={`${styles.bubble} ${m.role === 'user' ? styles.userBubble : ''} ${m.isError ? styles.errBubble : ''}`}>
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div
            className={styles.msg}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={`${styles.avatar} ${styles.aiAvatar}`}>AI</div>
            <div className={styles.bubble}>
              <div className={styles.typing}>
                <span /><span /><span />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className={styles.inputRow}>
        <input
          ref={inputRef}
          className={styles.chatInput}
          placeholder="Ask about vulnerabilities, fixes, risk levels..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={loading}
        />
        <button
          className={styles.sendBtn}
          onClick={() => send()}
          disabled={loading || !input.trim()}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
