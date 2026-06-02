import express from 'express'
import cors from 'cors'
import axios from 'axios'
import https from 'https'
import dns from 'dns/promises'
import fs from 'fs/promises'
import path from 'path'
import session from 'express-session'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 4000
const HISTORY_FILE = path.join(__dirname, 'history.json')

const GROK_KEY    = process.env.GROK_API_KEY
const VT_KEY      = process.env.VIRUSTOTAL_API_KEY
const URLSCAN_KEY = process.env.URLSCAN_API_KEY
const GSB_KEY     = process.env.GOOGLE_SAFE_BROWSING_API_KEY

const app = express()
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
const frontendOrigins = [FRONTEND_URL, 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173']
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || frontendOrigins.includes(origin)) return callback(null, true)
    callback(new Error('CORS origin denied'))
  },
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(session({
  secret: process.env.SESSION_SECRET || 'cyberscan-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}))

const USERS_FILE = path.join(__dirname, 'users.json')

async function loadUsers() {
  try {
    const file = await fs.readFile(USERS_FILE, 'utf8')
    return JSON.parse(file)
  } catch {
    return []
  }
}

async function saveUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8')
}

async function getUserByEmail(email) {
  const users = await loadUsers()
  return users.find(user => user.email === email.toLowerCase().trim())
}

function requireAuth(req, res, next) {
  if (req.session?.user?.id) return next()
  return res.status(401).json({ error: 'Authentication required' })
}

function sanitizeUser(user) {
  if (!user) return null
  return { id: user.id, email: user.email, createdAt: user.createdAt }
}

async function registerUser(email, password) {
  const hashed = await bcrypt.hash(password, 12)
  const now = new Date().toISOString()
  const users = await loadUsers()
  const id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1
  const user = { id, email: email.toLowerCase().trim(), password: hashed, createdAt: now }
  users.push(user)
  await saveUsers(users)
  return user
}

async function verifyUser(email, password) {
  const user = await getUserByEmail(email)
  if (!user) return null
  const valid = await bcrypt.compare(password, user.password)
  return valid ? user : null
}

// ── RATE LIMITING ─────────────────────────────────────────
const scanCounts = new Map()
function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress
  const now = Date.now()
  const entry = scanCounts.get(ip) || { count: 0, reset: now + 60000 }
  if (now > entry.reset) { entry.count = 0; entry.reset = now + 60000 }
  entry.count++
  scanCounts.set(ip, entry)
  if (entry.count > 20) return res.status(429).json({ error: 'Rate limit exceeded. Max 20 scans/minute.' })
  next()
}

// ── INPUT VALIDATION ─────────────────────────────────────
function validateTarget(target) {
  if (!target || typeof target !== 'string') return false
  const t = target.trim()
  if (t.length > 2048) return false
  try {
    const url = /^https?:\/\//i.test(t) ? t : `https://${t}`
    new URL(url)
    return true
  } catch { return false }
}

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

async function checkGoogleSafeBrowsing(url) {
  if (!GSB_KEY) return null
  try {
    const res = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GSB_KEY}`,
      {
        client: { clientId: 'cyberscan', clientVersion: '2.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
    )
    const matches = res.data?.matches || []
    if (matches.length > 0) {
      return {
        flagged: true,
        threats: matches.map(m => ({ type: m.threatType, platform: m.platformType })),
      }
    }
    return { flagged: false }
  } catch { return null }
}

async function checkPhishTank(url) {
  try {
    const res = await axios.post(
      'https://checkurl.phishtank.com/checkurl/',
      new URLSearchParams({ url, format: 'json', app_key: '' }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'phishtank/cyberscan' }, timeout: 8000 }
    )
    const d = res.data?.results
    if (d?.in_database && d?.valid) {
      return { phish: true, verified: d.verified, phishId: d.phish_id, detail: d.phish_detail_page }
    }
    return { phish: false }
  } catch { return null }
}

async function checkDomainAge(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    // Use RDAP (free, no key needed)
    const tld = hostname.split('.').slice(-1)[0]
    const rdapRes = await axios.get(
      `https://rdap.org/domain/${hostname}`,
      { timeout: 6000, headers: { Accept: 'application/json' } }
    )
    const events = rdapRes.data?.events || []
    const reg = events.find(e => e.eventAction === 'registration')
    const regDate = reg ? new Date(reg.eventDate) : null
    const agedays = regDate ? Math.floor((Date.now() - regDate) / 86400000) : null
    // Also resolve IP
    let ip = null
    try { const addrs = await dns.resolve4(hostname); ip = addrs[0] } catch {}
    return { registered: regDate?.toISOString() || null, ageDays: agedays, hostname, ip }
  } catch { return null }
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
  const domainInfo = evidence.domain ? `Domain age: ${evidence.domain.ageDays ?? 'unknown'} days, IP: ${evidence.domain.ip || 'unknown'}` : 'Not checked'
  const prompt = `You are CYBERSCAN AI, an elite cybersecurity analyst. Analyze this URL threat scan result and provide a concise security assessment.

URL: ${url}
Threats Found: ${threats.length}
${threatSummary || 'No threats detected by automated scanners.'}

SSL: ${evidence.ssl ? `Valid=${evidence.ssl.valid}, Issuer=${evidence.ssl.issuer}, Days Left=${evidence.ssl.daysLeft}` : 'Not checked'}
URLhaus: ${evidence.urlhaus?.listed ? 'LISTED as malware' : 'Not listed'}
VirusTotal: ${evidence.virustotal ? `${evidence.virustotal.ratio} engines flagged` : 'Not checked'}
Google Safe Browsing: ${evidence.gsb?.flagged ? 'FLAGGED' : 'Clean'}
PhishTank: ${evidence.phishtank?.phish ? 'CONFIRMED PHISHING' : 'Not listed'}
${domainInfo}

Provide:
1. Overall verdict (2 sentences max)
2. Top 2 specific risks
3. Recommended action (1 sentence)

Be direct and technical. No fluff.`

  // Use Grok for AI analysis (Gemini disabled in this deployment)
  if (GROK_KEY) {
    try {
      const res = await axios.post(
        'https://api.grok.ai/v1/chat/completions',
        { model: 'grok-3-mini', max_tokens: 400, messages: [{ role: 'system', content: 'You are CYBERSCAN AI, an elite cybersecurity analyst.' }, { role: 'user', content: prompt }] },
        { headers: { Authorization: `Bearer ${GROK_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 }
      )
      return { text: res.data.choices?.[0]?.message?.content, engine: 'Grok' }
    } catch (e) {
      console.log('Grok AI analysis failed:', e.response?.data?.error || e.message)
    }
  }

  return null

  return null
}

// ── AI CHAT ───────────────────────────────────────────────

function formatAIError(e) {
  if (e.response?.data?.error) return e.response.data.error
  if (e.response?.statusText) return `${e.response.status}: ${e.response.statusText}`
  return e.message || 'Unknown AI error'
}

function isAIAuthError(e) {
  const message = String(e.response?.data?.error || e.response?.data?.message || e.message || '')
  return /unauthoriz|invalid|permission|auth|token|key/i.test(message)
}

async function callGrokAI(fullPrompt) {
  const body = {
    model: 'grok-3-mini',
    max_tokens: 500,
    messages: [
      { role: 'system', content: 'You are CYBERSCAN AI, an elite cybersecurity analyst. Be direct, practical, and concise. Answer in 3-5 sentences max.' },
      { role: 'user', content: fullPrompt },
    ],
  }
  const r = await axios.post(
    'https://api.grok.ai/v1/chat/completions',
    body,
    { headers: { Authorization: `Bearer ${GROK_KEY}`, 'Content-Type': 'application/json' }, timeout: 20000 }
  )
  return { text: r.data.choices?.[0]?.message?.content, engine: 'Grok' }
}


function createFallbackAIResponse(fullPrompt) {
  const safeMatch = /safe|visit|risk level|allowed|secure/i.test(fullPrompt)
  const blockMatch = /block|stop|prevent|malicious|danger|unsafe/i.test(fullPrompt)
  if (safeMatch && !blockMatch) {
    return 'AI chat is currently running in fallback mode because no AI API keys are configured. Based on the scan context, inspect the threat summary and sources above: if critical or high threats are present, avoid visiting this URL and treat it as unsafe.'
  }
  if (blockMatch) {
    return 'AI chat is in fallback mode without configured API keys. The safest action is to block or avoid this URL if any critical/high threats are listed, and use your security controls to prevent access.'
  }
  return 'AI chat is unavailable because no API keys are configured. Add GROK_API_KEY to backend/.env to enable live AI responses.'
}

app.post('/api/ai/chat', async (req, res) => {
  const { message, context, engine } = req.body
  if (!message) return res.status(400).json({ error: 'Missing message' })

  const fullPrompt = context
    ? `Scan context: ${context}\n\nUser question: ${message}`
    : message

  // Use Grok for all chat requests when configured.
  if (GROK_KEY) {
    try {
      return res.json(await callGrokAI(fullPrompt))
    } catch (grokError) {
      const grokMessage = formatAIError(grokError)
      if (isAIAuthError(grokError)) {
        return res.json({ text: createFallbackAIResponse(fullPrompt), engine: 'Fallback' })
      }
      return res.status(500).json({ error: `Grok failed: ${grokMessage}` })
    }
  }

  // Grok is not configured.

  const fallbackText = createFallbackAIResponse(fullPrompt)
  return res.json({ text: fallbackText, engine: 'Fallback' })
})

// ── MAIN SCAN ─────────────────────────────────────────────

async function performScan(target) {
  const url = /^https?:\/\//i.test(target) ? target : `https://${target}`

  try { new URL(url) } catch {
    return { id: `SCAN-${Date.now()}`, target, error: 'Invalid URL', safe: false, score: 0, threats: [], summary: { critical: 0, high: 0, medium: 0, low: 0 } }
  }

  // Run all checks in parallel
  const [urlhausResult, vtResult, urlscanResult, sslResult, gsbResult, phishResult, domainResult] = await Promise.all([
    checkURLhaus(url),
    checkVirusTotal(url),
    checkURLScan(url),
    checkSSL(url),
    checkGoogleSafeBrowsing(url),
    checkPhishTank(url),
    checkDomainAge(url),
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

  // Google Safe Browsing findings
  if (gsbResult?.flagged) {
    const types = gsbResult.threats.map(t => t.type).join(', ')
    threats.push({
      id: `T-${Math.random().toString(36).slice(2, 8)}`,
      name: 'Google Safe Browsing Alert',
      severity: 'critical',
      score: 9.5,
      source: 'Google Safe Browsing',
      description: `Google Safe Browsing flagged this URL. Threat types: ${types}.`,
      owasp: 'A09:2021 – Security Logging and Monitoring Failures',
      recommendation: 'This URL is actively blocked by Google. Do not visit.',
    })
  }

  // PhishTank findings
  if (phishResult?.phish) {
    threats.push({
      id: `T-${Math.random().toString(36).slice(2, 8)}`,
      name: 'Known Phishing Site (PhishTank)',
      severity: 'critical',
      score: 9.6,
      source: 'PhishTank',
      description: `Confirmed phishing site in PhishTank database. ID: ${phishResult.phishId}. Verified: ${phishResult.verified}.`,
      owasp: 'A07:2021 – Identification and Authentication Failures',
      recommendation: 'This is a confirmed phishing site. Block immediately.',
    })
  }

  // Domain age findings
  if (domainResult?.ageDays !== null && domainResult?.ageDays !== undefined) {
    if (domainResult.ageDays < 30) {
      threats.push({
        id: `T-${Math.random().toString(36).slice(2, 8)}`,
        name: 'Newly Registered Domain',
        severity: 'high',
        score: 7.2,
        source: 'RDAP / Domain Intelligence',
        description: `Domain registered only ${domainResult.ageDays} day(s) ago (${domainResult.registered?.slice(0,10)}). Newly registered domains are frequently used for phishing and malware campaigns.`,
        owasp: 'A05:2021 – Security Misconfiguration',
        recommendation: 'Exercise extreme caution — newly registered domains are a major phishing indicator.',
      })
    } else if (domainResult.ageDays < 180) {
      threats.push({
        id: `T-${Math.random().toString(36).slice(2, 8)}`,
        name: 'Recently Registered Domain',
        severity: 'medium',
        score: 4.8,
        source: 'RDAP / Domain Intelligence',
        description: `Domain registered ${domainResult.ageDays} days ago (${domainResult.registered?.slice(0,10)}). Domains under 6 months old carry elevated risk.`,
        owasp: 'A05:2021 – Security Misconfiguration',
        recommendation: 'Verify the legitimacy of this domain before trusting it.',
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
    urlscan: urlscanResult ? { malicious: urlscanResult.malicious, score: urlscanResult.score, categories: urlscanResult.categories, screenshot: urlscanResult.screenshot, ip: urlscanResult.ip, country: urlscanResult.country, server: urlscanResult.server } : null,
    ssl: sslResult,
    gsb: gsbResult,
    phishtank: phishResult,
    domain: domainResult,
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
      gsb: gsbResult !== null,
      phishtank: phishResult !== null,
      domain: domainResult !== null,
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

app.post('/auth/register', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }
  try {
    const existing = await getUserByEmail(email)
    if (existing) return res.status(409).json({ error: 'Email already registered' })
    const user = await registerUser(email, password)
    req.session.user = sanitizeUser(user)
    res.status(201).json({ user: sanitizeUser(user) })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Unable to create account' })
  }
})

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' })
  }
  try {
    const user = await verifyUser(email, password)
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    req.session.user = sanitizeUser(user)
    res.json({ user: sanitizeUser(user) })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Unable to login' })
  }
})

app.get('/auth/me', (req, res) => {
  res.json({ user: sanitizeUser(req.session?.user) })
})

app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {})
  res.json({ success: true })
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '3.0',
    sources: {
      urlhaus: true,
      virustotal: !!VT_KEY,
      urlscan: !!URLSCAN_KEY,
      gsb: !!GSB_KEY,
      phishtank: true,
      domain: true,
      ssl: true,
      patterns: true,
    },
    ai: { grok: !!GROK_KEY },
  })
})

app.post('/api/scan', rateLimit, async (req, res) => {
  const { target } = req.body || {}
  if (!target) return res.status(400).json({ error: 'Missing target URL' })
  if (!validateTarget(target)) return res.status(400).json({ error: 'Invalid URL format' })
  try {
    const result = await performScan(target.trim())
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
  if (h.some(i => i.id === scan.id)) return res.status(200).json({ success: true, duplicate: true })
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
  console.log(`\n🛡  CyberScan Backend v3.0`)
  console.log(`   Running on http://localhost:${PORT}`)
  console.log(`   Sources: URLhaus ✓ | SSL ✓ | Patterns ✓ | PhishTank ✓ | RDAP ✓`)
  console.log(`   VirusTotal: ${VT_KEY ? '✓' : '✗ (add VIRUSTOTAL_API_KEY to .env)'}`)
  console.log(`   URLScan.io: ${URLSCAN_KEY ? '✓' : '✗ (add URLSCAN_API_KEY to .env)'}`)
  console.log(`   Google Safe Browsing: ${GSB_KEY ? '✓' : '✗ (add GOOGLE_SAFE_BROWSING_API_KEY to .env)'}`)
  console.log(`   AI: Grok ${GROK_KEY ? '✓' : '✗'}\n`)
})
