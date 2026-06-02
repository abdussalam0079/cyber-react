// All AI calls go through the backend — no keys exposed in frontend

export const GROK_MODELS   = ['grok-3-mini', 'grok-3', 'grok-2']
export const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro']

export function loadAIConfig() {
  return {
    engine:      localStorage.getItem('cs_engine')       || 'grok',
    grokModel:   localStorage.getItem('cs_grok_model')   || 'grok-3-mini',
    geminiModel: localStorage.getItem('cs_gemini_model') || 'gemini-2.0-flash',
  }
}

export function saveAIConfig(cfg) {
  localStorage.setItem('cs_engine',       cfg.engine)
  localStorage.setItem('cs_grok_model',   cfg.grokModel)
  localStorage.setItem('cs_gemini_model', cfg.geminiModel)
}

export async function callAI(prompt, { preferGemini = false } = {}) {
  const engine = 'grok'

  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: prompt, engine }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `AI API error ${res.status}`)
  }
  const data = await res.json()
  if (!data.text) throw new Error('No response from AI')
  return data.text
}

export function hasAnyKey() {
  return true // keys are on the backend
}

export function engineLabel() {
  const cfg = loadAIConfig()
  if (cfg.engine === 'gemini') return 'Gemini'
  if (cfg.engine === 'dual')   return 'Grok + Gemini'
  return 'Grok'
}
