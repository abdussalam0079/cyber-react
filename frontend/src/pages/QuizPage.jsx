import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Shield, Zap, Trophy, RefreshCw, ChevronRight } from 'lucide-react'
import styles from './QuizPage.module.css'

const QUESTIONS = [
  {
    q: 'What does "phishing" mean in cybersecurity?',
    options: ['Fishing for data with fake bait emails', 'A type of DDoS attack', 'Scanning open ports', 'Brute-forcing passwords'],
    answer: 0,
    exp: 'Phishing uses deceptive emails/sites to trick users into revealing credentials or installing malware.',
  },
  {
    q: 'What is a "zero-day" vulnerability?',
    options: ['A bug that has been fixed', 'A flaw unknown to the vendor with no patch available', 'A scheduled maintenance window', 'A firewall rule'],
    answer: 1,
    exp: 'Zero-day = 0 days for the vendor to fix it before it can be exploited in the wild.',
  },
  {
    q: 'Which protocol encrypts web traffic?',
    options: ['HTTP', 'FTP', 'HTTPS (TLS)', 'SMTP'],
    answer: 2,
    exp: 'HTTPS uses TLS (Transport Layer Security) to encrypt data between browser and server.',
  },
  {
    q: 'What does "SQL injection" exploit?',
    options: ['Weak passwords', 'Unsanitized database queries', 'Open firewall ports', 'Expired SSL certs'],
    answer: 1,
    exp: 'SQL injection inserts malicious SQL code into input fields to manipulate the database.',
  },
  {
    q: 'What is 2FA?',
    options: ['Two Firewall Architecture', 'Two-Factor Authentication', 'Dual Frequency Analysis', 'Second-layer Firewall Access'],
    answer: 1,
    exp: '2FA adds a second verification step (e.g. SMS code, authenticator app) beyond just a password.',
  },
  {
    q: 'What is a "man-in-the-middle" attack?',
    options: ['An insider threat', 'Intercepting communication between two parties', 'Overloading a server', 'Stealing cookies from a browser'],
    answer: 1,
    exp: 'MITM attacks secretly intercept and possibly alter communication between two parties.',
  },
  {
    q: 'What does "ransomware" do?',
    options: ['Steals passwords silently', 'Encrypts files and demands payment', 'Monitors network traffic', 'Creates fake websites'],
    answer: 1,
    exp: 'Ransomware encrypts victim files and demands a ransom (usually crypto) for the decryption key.',
  },
  {
    q: 'Which hashing algorithm is considered BROKEN for security?',
    options: ['SHA-256', 'bcrypt', 'MD5', 'Argon2'],
    answer: 2,
    exp: 'MD5 is cryptographically broken — collisions can be generated and it is not safe for passwords.',
  },
]

const XP_PER_CORRECT = 120

export default function QuizPage() {
  const [idx,      setIdx]      = useState(0)
  const [selected, setSelected] = useState(null)
  const [score,    setScore]    = useState(0)
  const [xp,       setXp]       = useState(0)
  const [done,     setDone]     = useState(false)
  const [streak,   setStreak]   = useState(0)

  const pageRef    = useRef(null)
  const cardRef    = useRef(null)
  const optRefs    = useRef([])
  const xpBarRef   = useRef(null)
  const scoreRef   = useRef(null)
  const expRef     = useRef(null)
  const doneRef    = useRef(null)

  /* entrance */
  useEffect(() => {
    gsap.fromTo(pageRef.current,
      { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' }
    )
    animateCard()
  }, [])

  function animateCard(dir = 1) {
    gsap.fromTo(cardRef.current,
      { opacity: 0, x: dir * 60, rotationY: dir * 12 },
      { opacity: 1, x: 0, rotationY: 0, duration: 0.55, ease: 'back.out(1.4)', transformPerspective: 800 }
    )
    gsap.fromTo(optRefs.current,
      { opacity: 0, x: dir * 30 },
      { opacity: 1, x: 0, duration: 0.4, stagger: 0.07, ease: 'power3.out', delay: 0.15 }
    )
  }

  function choose(i) {
    if (selected !== null) return
    setSelected(i)
    const correct = i === QUESTIONS[idx].answer

    /* flash option colors */
    optRefs.current.forEach((el, j) => {
      if (j === QUESTIONS[idx].answer) {
        gsap.to(el, { background: 'rgba(34,197,94,0.18)', borderColor: '#22c55e', duration: 0.3 })
      } else if (j === i && !correct) {
        gsap.to(el, { background: 'rgba(239,68,68,0.16)', borderColor: '#ef4444', duration: 0.3 })
      }
    })

    if (correct) {
      setScore(s => s + 1)
      setStreak(s => s + 1)
      const gained = XP_PER_CORRECT + streak * 10
      setXp(x => {
        const next = x + gained
        if (xpBarRef.current)
          gsap.to(xpBarRef.current, { width: `${(next % 1000) / 10}%`, duration: 0.6, ease: 'power2.out' })
        return next
      })
      /* score bounce */
      gsap.fromTo(scoreRef.current, { scale: 1.5, color: '#22c55e' }, { scale: 1, color: '#eef2ff', duration: 0.5, ease: 'elastic.out(1,0.4)' })
    } else {
      setStreak(0)
      gsap.fromTo(cardRef.current, { x: -12 }, { x: 0, duration: 0.4, ease: 'elastic.out(1,0.3)' })
    }

    /* show explanation */
    if (expRef.current) {
      gsap.fromTo(expRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, delay: 0.25 }
      )
    }
  }

  function next() {
    if (idx + 1 >= QUESTIONS.length) {
      setDone(true)
      gsap.fromTo(doneRef.current,
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.6)', delay: 0.1 }
      )
      return
    }
    gsap.to(cardRef.current, {
      opacity: 0, x: -50, duration: 0.3, ease: 'power2.in',
      onComplete: () => {
        setIdx(i => i + 1)
        setSelected(null)
        animateCard(1)
      }
    })
  }

  function restart() {
    setIdx(0); setSelected(null); setScore(0); setXp(0); setStreak(0); setDone(false)
    gsap.to(xpBarRef.current, { width: '0%', duration: 0.3 })
    setTimeout(() => animateCard(1), 50)
  }

  const q = QUESTIONS[idx]
  const pct = Math.round((score / QUESTIONS.length) * 100)

  return (
    <div ref={pageRef} className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Shield size={18} className={styles.headerIcon} />
          <span className={styles.headerTitle}>CYBER SECURITY QUIZ</span>
        </div>
        <div className={styles.headerRight}>
          <span ref={scoreRef} className={styles.scoreDisplay}>
            {score} <span className={styles.scoreDivider}>/</span> {QUESTIONS.length}
          </span>
          {streak > 1 && (
            <span className={styles.streakBadge}>
              🔥 x{streak} streak
            </span>
          )}
        </div>
      </div>

      {/* XP Bar */}
      <div className={styles.xpWrap}>
        <span className={styles.xpLabel}>XP {xp}</span>
        <div className={styles.xpTrack}>
          <div ref={xpBarRef} className={styles.xpFill} style={{ width: '0%' }} />
        </div>
        <span className={styles.xpLevel}>LVL {Math.floor(xp / 1000) + 1}</span>
      </div>

      {!done ? (
        <>
          {/* Progress dots */}
          <div className={styles.dots}>
            {QUESTIONS.map((_, i) => (
              <div key={i} className={`${styles.dot} ${i < idx ? styles.dotDone : i === idx ? styles.dotActive : ''}`} />
            ))}
          </div>

          {/* Question card */}
          <div ref={cardRef} className={styles.card} style={{ transformStyle: 'preserve-3d' }}>
            <div className={styles.qMeta}>
              Question {idx + 1} of {QUESTIONS.length}
            </div>
            <h2 className={styles.question}>{q.q}</h2>

            <div className={styles.options}>
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  ref={el => optRefs.current[i] = el}
                  className={`${styles.option} ${selected === i ? (i === q.answer ? styles.correct : styles.wrong) : selected !== null && i === q.answer ? styles.correct : ''}`}
                  onClick={() => choose(i)}
                  disabled={selected !== null}
                >
                  <span className={styles.optLetter}>{['A','B','C','D'][i]}</span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>

            {selected !== null && (
              <div ref={expRef} className={styles.explanation}>
                <Zap size={13} className={styles.expIcon} />
                {q.exp}
              </div>
            )}

            {selected !== null && (
              <button className={styles.nextBtn} onClick={next}>
                {idx + 1 >= QUESTIONS.length ? 'See Results' : 'Next Question'}
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </>
      ) : (
        <div ref={doneRef} className={styles.doneCard}>
          <Trophy size={48} className={styles.trophy} />
          <h2 className={styles.doneTitle}>
            {pct >= 80 ? 'Cyber Expert! 🎉' : pct >= 50 ? 'Good Job! 💪' : 'Keep Learning! 📚'}
          </h2>
          <div className={styles.doneScore}>{score} / {QUESTIONS.length} correct</div>
          <div className={styles.donePct} style={{ color: pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>
            {pct}% accuracy
          </div>
          <div className={styles.doneXp}>+{xp} XP earned</div>
          <div className={styles.doneGrid}>
            {[
              { label: 'Score',    val: `${score}/${QUESTIONS.length}` },
              { label: 'Accuracy', val: `${pct}%` },
              { label: 'XP',       val: `+${xp}` },
              { label: 'Level',    val: `${Math.floor(xp / 1000) + 1}` },
            ].map(s => (
              <div key={s.label} className={styles.doneStat}>
                <span className={styles.doneStatVal}>{s.val}</span>
                <span className={styles.doneStatLabel}>{s.label}</span>
              </div>
            ))}
          </div>
          <button className={styles.restartBtn} onClick={restart}>
            <RefreshCw size={15} /> Play Again
          </button>
        </div>
      )}
    </div>
  )
}
