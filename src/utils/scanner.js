const API_BASE = '/api'

export async function runScan(target, type) {
  try {
    const response = await fetch(`${API_BASE}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, type }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Scan service failed')
    }

    return await response.json()
  } catch (error) {
    console.error('Scan error:', error)
    throw error
  }
}

export async function getHistory() {
  try {
    const response = await fetch(`${API_BASE}/history`)
    if (!response.ok) throw new Error('History fetch failed')
    return await response.json()
  } catch (error) {
    console.error('History error:', error)
    return []
  }
}

export async function saveToHistory(scan) {
  try {
    const response = await fetch(`${API_BASE}/history`, {
      method: 'POST',
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
    const response = await fetch(`${API_BASE}/history`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Clear failed')
    return await response.json()
  } catch (error) {
    console.error('Clear error:', error)
  }
}

export async function deleteHistoryItem(id) {
  try {
    const response = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Delete failed')
    return await response.json()
  } catch (error) {
    console.error('Delete error:', error)
  }
}
