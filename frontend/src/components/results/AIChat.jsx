import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Cpu } from 'lucide-react'
import { callAI, loadAIConfig, engineLabel } from '../../utils/ai.js'
import styles from './AIChat.module.css'

const QUICK_QUESTIONS = [
  'Which threat is most urgent?',
  'Is this URL safe to visit?',
  'What is my overall risk level?',
  'How do I block this threat?',
]

const ENGINE_BADGE = {
  grok:   { icon: '𝕏', label: 'GROK',   color: '#e0e0e0' },
  gemini: { icon: '✦', label: 'GEMINI', color: '#4285f4' },
  dual:   { icon: '⚡', label: 'DUAL',   color: 'var(--neon)' },
}

export default function AIChat({ scan }) {
  const threats = scan.vulnerabilities ?? scan.threats ?? []
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Scan complete for "${scan.target.slice(0, 50)}${scan.target.length > 50 ? '…' : ''}". Found ${threats.length} threat(s) — ${scan.summary?.critical ?? 0} critical. Ask me anything about the results.`,
    },
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(q) {
    const question = (q || input).trim()
    if (!question || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: question }])
    setLoading(true)
    try {
      const prompt = `You are CYBERSCAN AI, a cybersecurity assistant. Answer in 2-4 sentences. Be practical and direct.

Scan context: Target "${scan.target}" — ${threats.length} threats found: ${threats.map(v => v.name).join(', ') || 'none'}. Overall risk score: ${scan.score}/10.

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

        {loading && (
          <motion.div className={styles.msg} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`${styles.avatar} ${styles.aiAvatar}`}>AI</div>
            <div className={styles.bubble}>
              <div className={styles.typing}><span /><span /><span /></div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputRow}>
        <input
          className={styles.chatInput}
          placeholder="Ask about threats, fixes, risk levels..."
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
