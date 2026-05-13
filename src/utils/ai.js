// ── AI ENGINE: Grok (xAI) + Gemini (Google) ──────────────

export const GROK_MODELS   = ['grok-3-mini', 'grok-3', 'grok-2']
export const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro']

// ── DEFAULT KEYS (pre-configured — replace after regenerating) ──
const DEFAULT_GROK_KEY   = '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'
const DEFAULT_GEMINI_KEY = 'AIzaSyCHecHPdnSBlX2O6aL_srV0TAm_GIYTqeg'
const DEFAULT_ENGINE     = 'dual'

export function loadAIConfig() {
  return {
    engine:      localStorage.getItem('cs_engine')       || DEFAULT_ENGINE,
    grokKey:     localStorage.getItem('cs_grok_key')     || DEFAULT_GROK_KEY,
    geminiKey:   localStorage.getItem('cs_gemini_key')   || DEFAULT_GEMINI_KEY,
    grokModel:   localStorage.getItem('cs_grok_model')   || 'grok-3-mini',
    geminiModel: localStorage.getItem('cs_gemini_model') || 'gemini-2.0-flash',
  }
}

export function saveAIConfig(cfg) {
  localStorage.setItem('cs_engine',       cfg.engine)
  localStorage.setItem('cs_grok_key',     cfg.grokKey)
  localStorage.setItem('cs_gemini_key',   cfg.geminiKey)
  localStorage.setItem('cs_grok_model',   cfg.grokModel)
  localStorage.setItem('cs_gemini_model', cfg.geminiModel)
}

async function callGrok(prompt, cfg) {
  if (!cfg.grokKey) throw new Error('No Grok API key — open Settings to add one.')
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.grokKey}`,
    },
    body: JSON.stringify({
      model: cfg.grokModel || 'grok-3-mini',
      max_tokens: 700,
      messages: [
        { role: 'system', content: 'You are CYBERSCAN AI, an elite cybersecurity analyst. Be direct, practical, and concise. No fluff.' },
        { role: 'user', content: prompt },
      ],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Grok API error ${res.status}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || 'No response from Grok.'
}

async function callGemini(prompt, cfg) {
  if (!cfg.geminiKey) throw new Error('No Gemini API key — open Settings to add one.')
  const model = cfg.geminiModel || 'gemini-2.0-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.geminiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: 'You are CYBERSCAN AI, an elite cybersecurity analyst. Be direct, practical, concise.\n\n' + prompt }],
      }],
      generationConfig: { maxOutputTokens: 700, temperature: 0.4 },
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Gemini API error ${res.status}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.'
}

export async function callAI(prompt, { preferGemini = false } = {}) {
  const cfg = loadAIConfig()
  if (cfg.engine === 'gemini') return callGemini(prompt, cfg)
  if (cfg.engine === 'dual')   return preferGemini ? callGemini(prompt, cfg) : callGrok(prompt, cfg)
  return callGrok(prompt, cfg)
}

export function hasAnyKey() {
  const cfg = loadAIConfig()
  return !!(cfg.grokKey || cfg.geminiKey)
}

export function engineLabel() {
  const cfg = loadAIConfig()
  if (cfg.engine === 'gemini') return 'Gemini'
  if (cfg.engine === 'dual')   return 'Grok + Gemini'
  return 'Grok'
}
