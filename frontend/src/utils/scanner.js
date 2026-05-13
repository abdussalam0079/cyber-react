const API = '/api'

export async function runScan(target) {
  const res = await fetch(`${API}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Scan failed')
  }
  return res.json()
}

export async function getHistory() {
  try {
    const res = await fetch(`${API}/history`)
    if (!res.ok) return []
    return res.json()
  } catch { return [] }
}

export async function saveToHistory(scan) {
  try {
    await fetch(`${API}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scan),
    })
  } catch {}
}

export async function clearHistory() {
  await fetch(`${API}/history`, { method: 'DELETE' })
}

export async function deleteHistoryItem(id) {
  await fetch(`${API}/history/${id}`, { method: 'DELETE' })
}

export async function aiChat(message, context) {
  const res = await fetch(`${API}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'AI request failed')
  }
  return res.json()
}
