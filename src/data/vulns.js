export const CVE_POOL = [
  { id: 'CVE-2024-1234',  score: 9.8,  desc: 'Critical SQL injection via parameterized query bypass' },
  { id: 'CVE-2023-44487', score: 7.5,  desc: 'HTTP/2 Rapid Reset Attack — RESET flood DDoS' },
  { id: 'CVE-2024-3094',  score: 10.0, desc: 'XZ Utils backdoor — supply chain compromise' },
  { id: 'CVE-2023-23397', score: 9.8,  desc: 'Microsoft Outlook privilege escalation zero-click' },
  { id: 'CVE-2024-21762', score: 9.8,  desc: 'Fortinet FortiOS out-of-bounds write' },
  { id: 'CVE-2023-4966',  score: 9.4,  desc: 'Citrix Bleed — session token leak' },
  { id: 'CVE-2024-0519',  score: 8.8,  desc: 'Chrome V8 OOB memory access vulnerability' },
  { id: 'CVE-2024-6387',  score: 8.1,  desc: 'OpenSSH RegreSSHion race condition RCE' },
  { id: 'CVE-2023-50164', score: 9.8,  desc: 'Apache Struts path traversal / RCE' },
  { id: 'CVE-2024-27198', score: 9.8,  desc: 'JetBrains TeamCity authentication bypass' },
]

export const VULN_TEMPLATES = [
  {
    name: 'SQL Injection',
    owasp: 'A03:2021 – Injection',
    owaspShort: 'A03',
    severity: 'critical',
    score: 9.3,
    cves: ['CVE-2024-1234', 'CVE-2023-50164'],
    desc: 'Unsanitized user input flows directly into SQL query construction, enabling database extraction or full compromise.',
    fix: `// ❌ VULNERABLE
const query = "SELECT * FROM users WHERE id = " + userId;

// ✅ FIXED — Parameterized query
const query = "SELECT * FROM users WHERE id = $1";
await db.query(query, [userId]);

// ✅ ORM approach (Prisma)
const user = await prisma.user.findUnique({
  where: { id: parseInt(userId) }
});`,
  },
  {
    name: 'Cross-Site Scripting (XSS)',
    owasp: 'A03:2021 – Injection',
    owaspShort: 'A03',
    severity: 'high',
    score: 7.8,
    cves: ['CVE-2024-0519'],
    desc: 'Reflected user input rendered in HTML without encoding allows arbitrary script injection into victim browsers.',
    fix: `// ❌ VULNERABLE
res.send('<div>' + req.query.name + '</div>');

// ✅ FIXED — Escape HTML
import { escape } from 'html-escaper';
res.send('<div>' + escape(req.query.name) + '</div>');

// ✅ React (auto-escapes by default)
// Never use dangerouslySetInnerHTML with user content`,
  },
  {
    name: 'Broken Authentication',
    owasp: 'A07:2021 – Identification and Authentication Failures',
    owaspShort: 'A07',
    severity: 'critical',
    score: 9.1,
    cves: ['CVE-2023-23397'],
    desc: 'Session tokens never expire, transmitted over HTTP, no brute-force protection — enabling trivial account takeover.',
    fix: `// ✅ Secure session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,   // HTTPS only
    httpOnly: true, // No JS access
    maxAge: 3_600_000, // 1 hour
    sameSite: 'strict'
  }
}));`,
  },
  {
    name: 'Sensitive Data Exposure',
    owasp: 'A02:2021 – Cryptographic Failures',
    owaspShort: 'A02',
    severity: 'high',
    score: 8.2,
    cves: ['CVE-2023-4966'],
    desc: 'Passwords stored as MD5 hashes. API keys committed in plaintext to version control repositories.',
    fix: `// ✅ Hash passwords with bcrypt
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash(password, 12);
const valid = await bcrypt.compare(input, hash);

// ✅ Load secrets from environment only
const apiKey = process.env.API_KEY;
// Add .env to .gitignore — NEVER commit secrets`,
  },
  {
    name: 'Security Misconfiguration',
    owasp: 'A05:2021 – Security Misconfiguration',
    owaspShort: 'A05',
    severity: 'medium',
    score: 6.5,
    cves: [],
    desc: 'Default credentials active, directory listing enabled, verbose error messages expose full stack traces to users.',
    fix: `// ✅ Disable verbose errors in production
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({ error: 'Internal error' });
  }
  next(err);
});

// ✅ Helmet for security headers
import helmet from 'helmet';
app.use(helmet());`,
  },
  {
    name: 'Vulnerable Components',
    owasp: 'A06:2021 – Vulnerable and Outdated Components',
    owaspShort: 'A06',
    severity: 'high',
    score: 7.5,
    cves: ['CVE-2024-6387', 'CVE-2024-21762'],
    desc: 'Dependencies include lodash 4.17.15 (prototype pollution) and express 4.16.0 with known path traversal.',
    fix: `# ✅ Audit and auto-fix dependencies
npm audit fix --force

# ✅ Check for outdated packages
npx npm-check-updates -u

# ✅ Automated vulnerability scanning
npx snyk test
# Add Dependabot to GitHub for automatic PRs`,
  },
  {
    name: 'Server-Side Request Forgery',
    owasp: 'A10:2021 – Server-Side Request Forgery',
    owaspShort: 'A10',
    severity: 'critical',
    score: 9.0,
    cves: ['CVE-2024-27198'],
    desc: 'User-supplied URLs fetched server-side without validation, allowing access to internal services and cloud metadata endpoints.',
    fix: `// ✅ Allowlist-based URL validation
import { URL } from 'url';

function isSafeUrl(raw) {
  const u = new URL(raw);
  const blocked = [
    'localhost', '127.0.0.1',
    '169.254.169.254', // AWS metadata
    '::1'
  ];
  const isPrivate = /^(10\\.|192\\.168\\.|172\\.(1[6-9]|2\\d|3[01])\\.)/.test(u.hostname);
  return ['http:','https:'].includes(u.protocol)
    && !blocked.includes(u.hostname)
    && !isPrivate;
}`,
  },
  {
    name: 'Broken Access Control',
    owasp: 'A01:2021 – Broken Access Control',
    owaspShort: 'A01',
    severity: 'critical',
    score: 9.5,
    cves: ['CVE-2023-44487'],
    desc: 'API endpoints lack authorization checks. Any authenticated user can access or modify other users\' resources by changing IDs.',
    fix: `// ✅ Always verify resource ownership
app.get('/api/reports/:id', authenticate, async (req, res) => {
  const report = await Report.findById(req.params.id);

  if (!report) return res.status(404).json({ error: 'Not found' });

  // Critical: check ownership
  if (report.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(report);
});`,
  },
  {
    name: 'Insufficient Logging',
    owasp: 'A09:2021 – Security Logging and Monitoring Failures',
    owaspShort: 'A09',
    severity: 'low',
    score: 3.5,
    cves: [],
    desc: 'No failed login logging, no brute-force alerting, and no audit trail for sensitive operations like data deletion.',
    fix: `// ✅ Log security events with Winston
import winston from 'winston';
const logger = winston.createLogger({ ... });

app.post('/login', async (req, res) => {
  const success = await authenticate(req.body);
  logger.log(success ? 'info' : 'warn', 'Login attempt', {
    ip: req.ip,
    email: req.body.email,
    success,
    timestamp: new Date().toISOString()
  });
});`,
  },
  {
    name: 'XML External Entity (XXE)',
    owasp: 'A04:2021 – Insecure Design',
    owaspShort: 'A04',
    severity: 'high',
    score: 8.0,
    cves: [],
    desc: 'XML parser processes external entity references from user-supplied XML, enabling file disclosure and internal SSRF.',
    fix: `// ✅ Disable external entities in xml2js
import { parseString } from 'xml2js';

parseString(xmlInput, {
  explicitArray: false,
  // Disable XXE
  xmlns: false,
}, callback);

// ✅ Prefer JSON over XML for APIs
// If XML is needed, use a hardened parser like fast-xml-parser
// with processEntities: false`,
  },
]

export const SCAN_CHECKS = [
  'SQL Injection', 'XSS', 'CSRF', 'SSRF', 'Auth Bypass',
  'XXE', 'IDOR', 'RCE', 'Path Traversal', 'Open Redirect',
]
