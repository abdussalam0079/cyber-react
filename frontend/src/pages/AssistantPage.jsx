import AIChat from '../components/results/AIChat'
import styles from './AssistantPage.module.css'

export default function AssistantPage() {
  const emptyScan = {
    target: 'Interactive Assistant',
    threats: [],
    score: 0,
    summary: { critical: 0, high: 0, medium: 0, low: 0 },
    sources: {},
    evidence: {},
    aiAnalysis: { engine: 'grok', title: 'Interactive Assistant', summary: '', text: '' },
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Chat Bot — CyberScan Assistant</h1>
        <p className={styles.subtitle}>Ask the assistant about threat hunting, scanning, and remediation.</p>
        <AIChat scan={emptyScan} />
      </div>
    </div>
  )
}
