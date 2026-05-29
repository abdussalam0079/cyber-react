<div align="center">

# 🛡️ CyberScan

### Real-Time URL Threat Intelligence Scanner

**Scan any URL against 7+ live threat intelligence sources — powered by AI.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

<br/>

![CyberScan Screenshot](https://placehold.co/900x480/0f172a/00ffe0?text=CyberScan+%E2%80%94+URL+Threat+Scanner&font=montserrat)

</div>

---

## ✨ What is CyberScan?

CyberScan is a **full-stack URL threat scanner** that checks any URL against multiple real-world threat intelligence databases in parallel, performs SSL certificate analysis, inspects domain age, detects phishing patterns, and delivers an AI-powered security assessment — all in seconds.

No demo data. No fake results. Every scan hits live APIs.

---

## 🔍 Threat Intelligence Sources

| Source | Type | Key Required |
|---|---|---|
| 🦠 **URLhaus** (abuse.ch) | Malware database | No — free |
| 🔬 **VirusTotal** | 70+ AV engine scan | Yes — free tier |
| 🌐 **URLScan.io** | Browser-based page scan + screenshot | Yes — free tier |
| 🔴 **Google Safe Browsing** | Malware / phishing blocklist | Yes — free |
| 🎣 **PhishTank** | Confirmed phishing registry | No — free |
| 🏛️ **RDAP / Domain Age** | Domain registration date via RDAP | No — free |
| 🔒 **SSL Analysis** | Certificate validity, expiry, issuer | No — built-in |
| 🧠 **Pattern Analysis** | Heuristic URL inspection | No — built-in |

---

## 🤖 AI-Powered Analysis

CyberScan uses **dual AI engines** to generate threat assessments and answer your questions:

- **Grok** (xAI) — primary engine
- **Gemini** (Google) — fallback / secondary

After every scan you get:
- A static AI verdict summarizing all findings
- A live **AI chat assistant** to ask follow-up questions about the results

---

## 🚀 Features

- ⚡ **Parallel scanning** — all 7 sources run simultaneously
- 📊 **Risk gauge** — animated CVSS-style score (0–10)
- 📈 **Risk breakdown bars** — attack complexity, exploitability, impact scope
- 🖼️ **Page screenshot** — live browser screenshot via URLScan.io
- 🌍 **Domain metadata** — IP address, country, server, domain age
- 🏷️ **Source badges** — per-source ✓ / ✗ / ⚠ status at a glance
- 📋 **Scan history** — persistent history with delete/clear
- 📄 **Export report** — full `.txt` report download
- 🔒 **Rate limiting** — 20 scans/minute per IP
- 🛡️ **Input validation** — URL sanitization before any scan

---

## 🗂️ Project Structure

```
cyberscan-react/
├── backend/
│   ├── server.js          # Express API — all scanning logic
│   ├── .env               # API keys (never committed)
│   ├── history.json       # Scan history (auto-created)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── HomePage.jsx       # Scan input + progress
    │   │   ├── ResultsPage.jsx    # Full results + AI chat
    │   │   └── HistoryPage.jsx    # Scan history
    │   ├── components/
    │   │   ├── results/
    │   │   │   ├── RiskGauge.jsx  # Animated score arc
    │   │   │   ├── RiskBars.jsx   # Risk breakdown bars
    │   │   │   └── AIChat.jsx     # Live AI chat
    │   │   └── scanner/
    │   │       └── ScanProgress.jsx  # Step-by-step progress overlay
    │   └── utils/
    │       ├── scanner.js         # API calls + SCAN_STEPS
    │       └── ai.js              # AI engine routing
    └── package.json
```

---

## ⚙️ Setup

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- npm v9+

### 1. Clone the repo


```bash
git clone https://github.com/yourusername/cyberscan-react.git
cd cyberscan-react
```

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Configure API keys

Edit `backend/.env`:

```env
PORT=4000

# AI (required for AI analysis + chat)
GROK_API_KEY=your_grok_key_here
GEMINI_API_KEY=your_gemini_key_here

# Threat Intel (optional — scanner works without these, just fewer sources)
VIRUSTOTAL_API_KEY=your_vt_key_here
URLSCAN_API_KEY=your_urlscan_key_here
GOOGLE_SAFE_BROWSING_API_KEY=your_gsb_key_here
```

> **URLhaus, PhishTank, RDAP, and SSL analysis are always active — no keys needed.**

### 4. Run

Open two terminals:

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# → http://localhost:4000

# Terminal 2 — Frontend
cd frontend
npm run dev
# → http://localhost:3000
```

Open **http://localhost:3000** and start scanning.

---

## 🔑 Getting Free API Keys

| Service | Link | Free Tier |
|---|---|---|
| VirusTotal | [virustotal.com/gui/my-apikey](https://www.virustotal.com/gui/my-apikey) | 4 lookups/min |
| URLScan.io | [urlscan.io/user/profile](https://urlscan.io/user/profile/) | 100 scans/day |
| Google Safe Browsing | [console.cloud.google.com](https://console.cloud.google.com/apis/library/safebrowsing.googleapis.com) | 10,000 req/day |
| Grok (xAI) | [console.x.ai](https://console.x.ai) | Free credits |
| Gemini (Google) | [aistudio.google.com](https://aistudio.google.com/app/apikey) | Free tier |

---

## 🧪 Example Scan

Scanning a known malicious URL will show:

```
🛡 Threat Analysis Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Target:        http://malware-example.xyz/payload
Threat Score:  9.8 / 10  ← CRITICAL RISK
Scan ID:       SCAN-1718293847123

Intelligence Sources
  ✗ URLhaus          → LISTED as malware
  ✗ VirusTotal       → 48/72 engines flagged
  ✗ Google Safe Browsing → FLAGGED (MALWARE)
  ✗ PhishTank        → Confirmed phishing
  ✓ URLScan.io       → Malicious page detected
  ✗ SSL Cert         → Expired
  ✗ Domain Age       → 3 days old

Detected Threats (6)
  [CRITICAL] Malicious URL (URLhaus)
  [CRITICAL] Google Safe Browsing Alert
  [CRITICAL] Known Phishing Site (PhishTank)
  [HIGH]     Flagged by Antivirus Engines — 48/72
  [HIGH]     Newly Registered Domain — 3 days
  [HIGH]     Expired SSL Certificate
```

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite 5
- React Router v6
- Framer Motion (animations)
- Lucide React (icons)
- CSS Modules

**Backend**
- Node.js + Express 4
- Axios (HTTP client)
- Built-in `https` + `dns/promises` modules
- dotenv

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/scan` | Run a full URL scan |
| `POST` | `/api/ai/chat` | Send a message to the AI assistant |
| `GET` | `/api/history` | Fetch scan history |
| `POST` | `/api/history` | Save a scan to history |
| `DELETE` | `/api/history` | Clear all history |
| `DELETE` | `/api/history/:id` | Delete a single scan |
| `GET` | `/api/health` | Check backend status + active sources |

### POST `/api/scan`

```json
{ "target": "https://example.com" }
```

Returns a full scan result including `threats`, `evidence`, `summary`, `score`, `aiAnalysis`, and `sources`.

---

## 🔐 Security Notes

- API keys are stored **server-side only** — never exposed to the browser
- All AI calls are proxied through the backend
- Input is validated and sanitized before any external API call
- Rate limited to **20 scans per minute** per IP
- `.env` and `history.json` are excluded from version control

---

## 📄 License

MIT © 2024 CyberScan

---

<div align="center">

Built with ❤️ and a healthy paranoia about sketchy URLs.

**[⬆ Back to top](#️-cyberscan)**

</div>
