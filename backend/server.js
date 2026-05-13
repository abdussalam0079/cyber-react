import express from 'express'
import cors from 'cors'
import axios from 'axios'
import https from 'https'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const dotenv = require('dotenv')
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 4000
const HISTORY_FILE = path.join(__dirname, 'history.json')

const GROK_KEY = process.env.GROK_API_KEY
const GEMINI_KEY = process.env.GEMINI_API_KEY
const VT_KEY = process.env.VIRUSTOTAL_API_KEY
const URLSCAN_KEY = process.env.URLSCAN_API_KEY

const app = express()
app.use(cors())
app.use(express.json())

// ── THREAT INTEL SOURCES ──────────────────────────────────

async function checkURLhaus(url) {
  try {
    const res = await axios.post(
      'https://urlhaus-api.abuse.ch/v1/url/',
      `url=${encodeURIComponent(url)}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 8000 }
    )
    const d = res.data
    if (d.query_status === 'is_listed') {
      return {
        listed: true,
        threat: d.threat || 'malware',
        tags: d.tags || [],
        urlCount: d.urls_on_this_host || 1,
        dateAdded: d.date_added,
      }
    }
    return { listed: false }
  } catch {
    return null
  }
}

async function checkVirusTotal(url) {
  if (!VT_KEY) return null
  try {
    // Submit URL for analysis
    const submitRes = await axios.post(
      'https://www.virustotal.com/api/v3/urls',
      `url=${encodeURIComponent(url)}`,
      {
        headers: {
          'x-apikey': VT_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      }
    )
    const analysisId = submitRes.data?.data?.id
    if (!analysisId) return null

    // Wait briefly then fetch results
    await new Promise(r => setTimeout(r, 3000))
    const resultRes = await axios.get(
      `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
      { headers: { 'x-apikey': VT_KEY }, timeout: 10000 }
    )
    const stats = resultRes.data?.data?.attributes?.stats || {}
    const malicious = (stats.malicious || 0) + (stats.suspicious || 0)
    const total = Object.values(stats).reduce((a, b) => a + b, 0)
    return {
      malicious,
      suspicious: stats.suspicious || 0,
      harmless: stats.harmless || 0,
      total,
      ratio: total > 0 ? `${malicious}/${total}` : '0/0',
    }
  } catch {
    return null
  }
}

async function checkURLScan(url) {
  if (!URLSCAN_KEY) return null
  try {
    const submitRes = await axios.post(
      'https://urlscan.io/api/v1/scan/',
      { url, visibility: 'public' },
      {
        headers: {
          'API-Key': URLSCAN_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    )
    const uuid = submitRes.data?.uuid
    if (!uuid) return null

    await new Promise(r => setTimeout(r, 8000))
    const resultRes = await axios.get(
      `https://urlscan.io/api/v1/result/${uuid}/`,
      { timeout: 10000 }
    )
    const d = resultRes.data
    return {
      malicious: d.verdicts?.overall?.malicious || false,
      score: d.verdicts?.overall?.score || 0,
      categories: d.verdicts?.overall?.categories || [],
      brands: d.verdicts?.overall?.brands || [],
      screenshot: d.task?.screenshotURL || null,
      country: d.page?.country || null,
      server: d.page?.server || null,
      ip: d.page?.ip || null,
    }
  } catch {
    return null
  }
}

async function checkSSL(url) {
  return new Promise(resolve => {
    try {
      const hostname = new URL(url).hostname
      const req = https.request(
        { hostname, port: 443, method: 'HEAD', timeout: 6000, rejectUnauthorized: false },
        res => {
          const cert = res.socket.getPeerCertificate()
          const authorized = res.socket.authorized
          const now = new Date()
          const expiry = cert?.valid_to ? new Date(cert.valid_to) : null
          const daysLeft = expiry ? Math.floor((expiry - now) / 86400000) : null
          resolve({
            valid: authorized,
            issuer: cert?.issuer?.O || cert?.issuer?.CN || 'Unknown',
            subject: cert?.subject?.CN || hostname,
            expiresAt: cert?.valid_to || null,
            daysLeft,
            expired: daysLeft !== null && daysLeft < 0,
            expiringSoon: daysLeft !== null && daysLeft >= 0 && daysLeft < 30,
          })
        }
      )
      req.on('error', () => resolve({ valid: false, issuer: 'Unknown', subject: '', error: true }))
      req.on('timeout', () => { req.destroy(); resolve({ valid: false, error: 'timeout' }) })
      req.end()
    } catch {
      resolve({ valid: false, error: 'invalid_url' })
    }
  })
}

function analyzeURLPatterns(url) {
  const findings = []
  let parsed
  try { parsed = new URL(url) } catch { return findings }

  const hostname = parsed.hostname
  const fullUrl = url.toLowerCase()

  // IP address instead of domain
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    findings.push({ type: 'ip_address', severity: 'high', detail: `Direct IP address: ${hostname}` })
  }

  // URL shorteners
  if (/^(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|short\.link|tiny\.cc|rb\.gy|cutt\.ly)$/.test(hostname)) {
    findings.push({ type: 'url_shortener', severity: 'medium', detail: `URL shortener detected: ${hostname}` })
  }

  // Phishing keywords in domain
  const phishKeywords = ['paypal', 'amazon', 'google', 'microsoft', 'apple', 'netflix', 'bank', 'secure', 'login', 'verify', 'account', 'update', 'confirm', 'password']
  const domainParts = hostname.replace(/\.(com|net|org|io|co)$/, '')
  for (const kw of phishKeywords) {
    if (domainParts.includes(kw) && !hostname.endsWith(`${kw}.com`) && !hostname.endsWith(`${kw}.net`)) {
      findings.push({ type: 'phishing_keyword', severity: 'high', detail: `Suspicious keyword "${kw}" in domain` })
      break
    }
  }

  // Excessive subdomains
  const subdomainCount = hostname.split('.').length - 2
  if (subdomainCount > 3) {
    findings.push({ type: 'excessive_subdomains', severity: 'medium', detail: `${subdomainCount} subdomain levels detected` })
  }

  // Homograph / punycode
  if (hostname.startsWith('xn--')) {
    findings.push({ type: 'punycode', severity: 'high', detail: 'Punycode/homograph domain detected' })
  }

  // HTTP (no SSL)
  if (parsed.protocol === 'http:') {
    findings.push({ type: 'no_ssl', severity: 'medium', detail: 'No HTTPS — unencrypted connection' })
  }

  // Long URL
  if (url.length > 200) {
    findings.push({ type: 'long_url', severity: 'low', detail: `Unusually long URL (${url.length} chars)` })
  }

  // Double slashes in path (obfuscation)
  if (parsed.pathname.includes('//')) {
    findings.push({ type: 'path_obfuscation', severity: 'medium', detail: 'Double slashes in URL path (possible obfuscation)' })
  }

  // @ symbol in URL (credential stuffing trick)
  if (fullUrl.includes('@')) {
    findings.push({ type: 'at_symbol', severity: 'high', detail: '@ symbol in URL — possible credential trick' })
  }

  // Hex/percent encoding abuse
  const encodedCount = (fullUrl.match(/%[0-9a-f]{2}/gi) || []).length
  if (encodedCount > 5) {
    findings.push({ type: 'encoding_abuse', severity: 'medium', detail: `Heavy URL encoding detected (${encodedCount} encoded chars)` })
  }

  return findings
}

// ── AI ANALYSIS ───────────────────────────────────────────

async function getAIAnalysis(url, threats, evidence) {
  const threatSummary = threats.map(t => `[${t.severity.toUpperCase()}] ${t.name}: ${t.description}`).join('\n')
  const prompt = `You are CYBERSCAN AI, an elite cybersecurity analyst. Analyze this URL threat scan result and provide a concise security assessment.

URL: ${url}
Threats Found: ${threats.length}
${threatSummary || 'No threats detected by automated scanners.'}

SSL: ${evidence.ssl ? `Valid=${evidence.ssl.valid}, Issuer=${evidence.ssl.issuer}, Days Left=${evidence.ssl.daysLeft}` : 'Not checked'}
URLhaus: ${evidence.urlhaus ? JSON.stringify(evidence.urlhaus) : 'Not listed'}
VirusTotal: ${evidence.virustotal ? `${evidence.virustotal.ratio} engines flagged` : 'Not checked'}

Provide:
1. Overall verdict (2 sentences max)
2. Top 2 specific risks
3. Recommended action (1 sentence)

Be direct and technical. No fluff.`

  // Try Grok first, fallback to Gemini
  if (GROK_KEY) {
    try {
      const res = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          model: 'grok-3-mini',
          max_tokens: 400,
          messages: [
            { role: 'system', content: 'You are CYBERSCAN AI, an elite cybersecurity analyst.' },
            { role: 'user', content: prompt },
          ],
        },
        { headers: { Authorization: `Bearer ${GROK_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 }
      )
      return { text: res.data.choices?.[0]?.message?.content, engine: 'Grok' }
    } catch (e) {
      console.log('Grok failed, trying Gemini:', e.message)
    }
  }

  if (GEMINI_KEY) {
    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 400, temperature: 0.3 },
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
      )
      return { text: res.data.candidates?.[0]?.content?.parts?.[0]?.text, engine: 'Gemini' }
    } catch (e) {
      console.log('Gemini failed:', e.message)
    }
  }

  return null
}

// ── AI CHAT ───────────────────────────────────────────────

app.post('/api/ai/chat', async (req, res) => {
  const { message, context, engine } = req.body
  if (!message) return res.status(400).json({ error: 'Missing message' })

  const systemPrompt = 'You are CYBERSCAN AI, an elite cybersecurity analyst. Be direct, practical, and concise. Answer in 3-5 sentences max.'
  const fullPrompt = context
    ? `Scan context: ${context}\n\nUser question: ${message}`
    : message

  if ((engine === 'grok' || engine === 'dual' || !engine) && GROK_KEY) {
    try {
      const r = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          model: 'grok-3-mini',
          max_tokens: 500,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: fullPrompt },
          ],
        },
        { headers: { Authorization: `Bearer ${GROK_KEY}`, 'Content-Type': 'application/json' }, timeout: 20000 }
      )
      return res.json({ text: r.data.choices?.[0]?.message?.content, engine: 'Grok' })
    } catch (e) {
      if (engine === 'grok') return res.status(500).json({ error: e.message })
    }
  }

  if ((engine === 'gemini' || engine === 'dual' || !engine) && GEMINI_KEY) {
    try {
      const r = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
          contents: [{ parts: [{ text: systemPrompt + '\n\n' + fullPrompt }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.3 },
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
      )
      return res.json({ text: r.data.candidates?.[0]?.content?.parts?.[0]?.text, engine: 'Gemini' })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  res.status(503).json({ error: 'No AI API keys configured. Add GROK_API_KEY or GEMINI_API_KEY to backend/.env' })
})

// ── MAIN SCAN ─────────────────────────────────────────────

async function performScan(target) {
  const url = /^https?:\/\//i.test(target) ? target : `https://${target}`

  try { new URL(url) } catch {
    return { id: `SCAN-${Date.now()}`, target, error: 'Invalid URL', safe: false, score: 0, threats: [], summary: { critical: 0, high: 0, medium: 0, low: 0 } }
  }

  // Run all checks in parallel
  const [urlhausResult, vtResult, urlscanResult, sslResult] = await Promise.all([
    checkURLhaus(url),
    checkVirusTotal(url),
    checkURLScan(url),
    checkSSL(url),
  ])

  const patternFindings = analyzeURLPatterns(url)
  const threats = []

  // URLhaus findings
  if (urlhausResult?.listed) {
    threats.push({
      id: `T-${Math.random().toString(36).slice(2, 8)}`,
      name: 'Malicious URL (URLhaus)',
      severity: 'critical',
      score: 9.8,
      source: 'URLhaus / abuse.ch',
      description: `Listed in URLhaus malware database as "${urlhausResult.threat}". Tags: ${urlhausResult.tags?.join(', ') || 'none'}. Reported ${urlhausResult.urlCount} URL(s) on this host.`,
      owasp: 'A09:2021 – Security Logging and Monitoring Failures',
      recommendation: 'Do not visit. Block this URL at firewall/DNS level immediately.',
    })
  }

  // VirusTotal findings
  if (vtResult && vtResult.malicious > 0) {
    const severity = vtResult.malicious >= 5 ? 'critical' : vtResult.malicious >= 2 ? 'high' : 'medium'
    threats.push({
      id: `T-${Math.random().toString(36).slice(2, 8)}`,
      name: 'Flagged by Antivirus Engines',
      severity,
      score: Math.min(9.5, 4 + vtResult.malicious * 0.8),
      source: 'VirusTotal',
      description: `${vtResult.ratio} security engines flagged this URL as malicious or suspicious.`,
      owasp: 'A05:2021 – Security Misconfiguration',
      recommendation: 'Avoid this URL. Multiple security vendors have flagged it as dangerous.',
    })
  }

  // URLScan findings
  if (urlscanResult?.malicious) {
    threats.push({
      id: `T-${Math.random().toString(36).slice(2, 8)}`,
      name: 'Malicious Page Detected (URLScan)',
      severity: 'critical',
      score: 9.2,
      source: 'URLScan.io',
      description: `URLScan.io classified this page as malicious. Categories: ${urlscanResult.categories?.join(', ') || 'unknown'}. Brands targeted: ${urlscanResult.brands?.join(', ') || 'none'}.`,
      owasp: 'A03:2021 – Injection',
      recommendation: 'This page has been confirmed malicious by automated browser analysis.',
    })
  }

  // SSL findings
  if (sslResult) {
    if (sslResult.expired) {
      threats.push({
        id: `T-${Math.random().toString(36).slice(2, 8)}`,
        name: 'Expired SSL Certificate',
        severity: 'high',
        score: 7.5,
        source: 'SSL Analysis',
        description: `SSL certificate expired. Issuer: ${sslResult.issuer}. Expired: ${sslResult.expiresAt}`,
        owasp: 'A02:2021 – Cryptographic Failures',
        recommendation: 'Certificate is expired — connection is not secure.',
      })
    } else if (sslResult.expiringSoon) {
      threats.push({
        id: `T-${Math.random().toString(36).slice(2, 8)}`,
        name: 'SSL Certificate Expiring Soon',
        severity: 'medium',
        score: 4.5,
        source: 'SSL Analysis',
        description: `SSL certificate expires in ${sslResult.daysLeft} days. Issuer: ${sslResult.issuer}.`,
        owasp: 'A02:2021 – Cryptographic Failures',
        recommendation: 'Renew SSL certificate before expiry to maintain secure connections.',
      })
    } else if (!sslResult.valid && !sslResult.error) {
      threats.push({
        id: `T-${Math.random().toString(36).slice(2, 8)}`,
        name: 'Invalid SSL Certificate',
        severity: 'high',
        score: 7.0,
        source: 'SSL Analysis',
        description: `SSL certificate is invalid or self-signed. Issuer: ${sslResult.issuer}.`,
        owasp: 'A02:2021 – Cryptographic Failures',
        recommendation: 'Do not trust this site — certificate cannot be verified.',
      })
    }
  }

  // Pattern-based findings
  const severityScoreMap = { high: 7.0, medium: 5.0, low: 2.5 }
  const patternNameMap = {
    ip_address: 'Direct IP Address URL',
    url_shortener: 'URL Shortener Detected',
    phishing_keyword: 'Phishing Keyword in Domain',
    excessive_subdomains: 'Excessive Subdomain Levels',
    punycode: 'Homograph/Punycode Domain',
    no_ssl: 'Unencrypted HTTP Connection',
    long_url: 'Abnormally Long URL',
    path_obfuscation: 'URL Path Obfuscation',
    at_symbol: 'Credential Trick (@) in URL',
    encoding_abuse: 'Excessive URL Encoding',
  }
  const owaspMap = {
    ip_address: 'A05:2021 – Security Misconfiguration',
    url_shortener: 'A05:2021 – Security Misconfiguration',
    phishing_keyword: 'A07:2021 – Identification and Authentication Failures',
    no_ssl: 'A02:2021 – Cryptographic Failures',
    punycode: 'A07:2021 – Identification and Authentication Failures',
    at_symbol: 'A07:2021 – Identification and Authentication Failures',
    encoding_abuse: 'A03:2021 – Injection',
    excessive_subdomains: 'A05:2021 – Security Misconfiguration',
    long_url: 'A05:2021 – Security Misconfiguration',
    path_obfuscation: 'A03:2021 – Injection',
  }

  for (const pf of patternFindings) {
    threats.push({
      id: `T-${Math.random().toString(36).slice(2, 8)}`,
      name: patternNameMap[pf.type] || pf.type,
      severity: pf.severity,
      score: severityScoreMap[pf.severity] || 3.0,
      source: 'Pattern Analysis',
      description: pf.detail,
      owasp: owaspMap[pf.type] || 'A05:2021 – Security Misconfiguration',
      recommendation: 'Exercise caution with this URL.',
    })
  }

  const evidence = {
    urlhaus: urlhausResult,
    virustotal: vtResult,
    urlscan: urlscanResult ? { malicious: urlscanResult.malicious, score: urlscanResult.score, categories: urlscanResult.categories, screenshot: urlscanResult.screenshot, ip: urlscanResult.ip, country: urlscanResult.country } : null,
    ssl: sslResult,
    patterns: patternFindings,
  }

  const maxScore = threats.length > 0 ? Math.max(...threats.map(t => t.score)) : 0
  const summary = {
    critical: threats.filter(t => t.severity === 'critical').length,
    high: threats.filter(t => t.severity === 'high').length,
    medium: threats.filter(t => t.severity === 'medium').length,
    low: threats.filter(t => t.severity === 'low').length,
  }

  // Get AI analysis
  const aiAnalysis = await getAIAnalysis(url, threats, evidence)

  return {
    id: `SCAN-${Date.now()}`,
    target,
    url,
    type: 'url',
    timestamp: new Date().toISOString(),
    score: maxScore,
    safe: maxScore === 0,
    threats,
    evidence,
    summary,
    aiAnalysis,
    sources: {
      urlhaus: urlhausResult !== null,
      virustotal: vtResult !== null,
      urlscan: urlscanResult !== null,
      ssl: sslResult !== null,
      patterns: true,
    },
  }
}

// ── HISTORY ───────────────────────────────────────────────

async function loadHistory() {
  try { return JSON.parse(await fs.readFile(HISTORY_FILE, 'utf8')) } catch { return [] }
}
async function saveHistory(h) {
  await fs.writeFile(HISTORY_FILE, JSON.stringify(h, null, 2))
}

// ── ROUTES ────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0',
    sources: {
      urlhaus: true,
      virustotal: !!VT_KEY,
      urlscan: !!URLSCAN_KEY,
      ssl: true,
      patterns: true,
    },
    ai: { grok: !!GROK_KEY, gemini: !!GEMINI_KEY },
  })
})

app.post('/api/scan', async (req, res) => {
  const { target } = req.body || {}
  if (!target) return res.status(400).json({ error: 'Missing target URL' })
  try {
    const result = await performScan(target)
    res.json(result)
  } catch (e) {
    console.error('Scan error:', e)
    res.status(500).json({ error: 'Scan failed: ' + e.message })
  }
})

app.get('/api/history', async (req, res) => res.json(await loadHistory()))

app.post('/api/history', async (req, res) => {
  const scan = req.body
  if (!scan?.id) return res.status(400).json({ error: 'Invalid payload' })
  const h = await loadHistory()
  h.unshift(scan)
  await saveHistory(h.slice(0, 100))
  res.status(201).json({ success: true })
})

app.delete('/api/history', async (req, res) => {
  await saveHistory([])
  res.json({ success: true })
})

app.delete('/api/history/:id', async (req, res) => {
  const h = await loadHistory()
  await saveHistory(h.filter(i => i.id !== req.params.id))
  res.json({ success: true })
})

app.listen(PORT, () => {
  console.log(`\n🌙 CyberScan Backend v2.0`)
  console.log(`   Running on http://localhost:${PORT}`)
  console.log(`   Sources: URLhaus ✓ | SSL ✓ | Patterns ✓`)
  console.log(`   VirusTotal: ${VT_KEY ? '✓' : '✗ (add key to .env)'}`)
  console.log(`   URLScan.io: ${URLSCAN_KEY ? '✓' : '✗ (add key to .env)'}`)
  console.log(`   AI: Grok ${GROK_KEY ? '✓' : '✗'} | Gemini ${GEMINI_KEY ? '✓' : '✗'}\n`)
})
