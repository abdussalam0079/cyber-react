const API_BASE = '/api'

export const SCAN_STEPS = [
  { label: 'Validating URL',              key: 'validate'   },
  { label: 'URLhaus Malware Check',       key: 'urlhaus'    },
  { label: 'VirusTotal Analysis',         key: 'virustotal' },
  { label: 'URLScan.io Browser Scan',     key: 'urlscan'    },
  { label: 'Google Safe Browsing',        key: 'gsb'        },
  { label: 'PhishTank Database',          key: 'phishtank'  },
  { label: 'Domain Age & WHOIS',          key: 'domain'     },
  { label: 'SSL Certificate Analysis',    key: 'ssl'        },
  { label: 'URL Pattern Analysis',        key: 'patterns'   },
  { label: 'AI Threat Assessment',        key: 'ai'         },
]

export async function runScan(target, _type, onProgress) {
  // Simulate step-by-step progress while the real scan runs in parallel
  let stepIdx = 0
  let done = false

  const advanceSteps = async () => {
    const delays = [300, 800, 1200, 2500, 800, 600, 700, 600, 400, 1500]
    for (let i = 0; i < SCAN_STEPS.length && !done; i++) {
      stepIdx = i
      const pct = Math.round((i / SCAN_STEPS.length) * 90)
      onProgress?.({ step: SCAN_STEPS[i].label, stepIdx: i, pct })
      await new Promise(r => setTimeout(r, delays[i] || 500))
    }
  }

  const [result] = await Promise.all([
    fetch(`${API_BASE}/scan`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target }),
    }).then(async res => {
      done = true
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Scan service failed')
      }
      return res.json()
    }),
    advanceSteps(),
  ])

  onProgress?.({ step: 'Complete', stepIdx: SCAN_STEPS.length, pct: 100 })
  return result
}

export async function getHistory() {
  try {
    const response = await fetch(`${API_BASE}/history`, { credentials: 'include' })
    if (!response.ok) throw new Error('History fetch failed')
    return await response.json()
  } catch { return [] }
}

export async function saveToHistory(scan) {
  try {
    const response = await fetch(`${API_BASE}/history`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scan),
    })
    if (!response.ok) throw new Error('Save failed')
    return await response.json()
  } catch (error) {
    console.error('Save error:', error)
  }
}

export async function clearHistory() {
  try {
    const response = await fetch(`${API_BASE}/history`, { method: 'DELETE', credentials: 'include' })
    if (!response.ok) throw new Error('Clear failed')
    return await response.json()
  } catch (error) {
    console.error('Clear error:', error)
  }
}

export async function deleteHistoryItem(id) {
  try {
    const response = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!response.ok) throw new Error('Delete failed')
    return await response.json()
  } catch (error) {
    console.error('Delete error:', error)
  }
}
