import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, Zap } from 'lucide-react'
import { aiChat } from '../../utils/scanner.js'
import s from './AIChat.module.css'

const QUICK = [
  'Is this URL dangerous?',
  'What is the biggest risk?',
  'How do I stay safe?',
  'Explain the SSL issue',
]

export default function AIChat({ scan }) {
  const threatNames = scan.threats.map(t => t.name).join(', ') || 'none'
  const context = `URL: ${scan.target} | Score: ${scan.score}/10 | Threats: ${threatNames} | Safe: ${scan.safe}`

  const [msgs, setMsgs] = useState([{
    role: 'ai',
    text: scan.aiAnalysis?.text
      ? scan.aiAnalysis.text
      : scan.safe
        ? `✅ "${scan.target}" appears safe — no threats detected. Ask me anything about this scan.`
        : `⚠️ Found ${scan.threats.length} threat(s) on "${scan.target}" (score ${scan.score}/10). Ask me anything.`,
    engine: scan.aiAnalysis?.engine,
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  async function send(q) {
    const text = (q || input).trim()
    if (!text || loading) return
    setInput('')
    setMsgs(m => [...m, { role: 'user', text }])
    setLoading(true)
    try {
      const res = await aiChat(text, context)
      setMsgs(m => [...m, { role: 'ai', text: res.text, engine: res.engine }])
    } catch (e) {
      setMsgs(m => [...m, { role: 'ai', text: `✕ ${e.message}`, isError: true }])
    }
    setLoading(false)
  }

  return (
    <div className={s.box}>
      <div className={s.header}>
        <div className={s.label}>
          <div className={s.dot} />
          <Bot size={13} />
          CYBERSCAN AI
        </div>
        <div className={s.quick}>
          {QUICK.map(q => (
            <button key={q} className={s.qBtn} onClick={() => send(q)}>{q}</button>
          ))}
        </div>
      </div>

      <div className={s.msgs}>
        <AnimatePresence initial={false}>
          {msgs.map((m, i) => (
            <motion.div
              key={i}
              className={`${s.msg} ${m.role === 'user' ? s.user : ''}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`${s.avatar} ${m.role === 'user' ? s.uAvatar : s.aAvatar}`}>
                {m.role === 'ai' ? 'AI' : 'ME'}
              </div>
              <div className={`${s.bubble} ${m.role === 'user' ? s.uBubble : ''} ${m.isError ? s.errBubble : ''}`}>
                {m.text}
                {m.engine && <span className={s.engine}>{m.engine}</span>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div className={s.msg} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={`${s.avatar} ${s.aAvatar}`}>AI</div>
            <div className={s.bubble}>
              <div className={s.typing}><span /><span /><span /></div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={s.inputRow}>
        <input
          className={s.input}
          placeholder="Ask about this scan..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={loading}
        />
        <button className={s.sendBtn} onClick={() => send()} disabled={loading || !input.trim()}>
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
