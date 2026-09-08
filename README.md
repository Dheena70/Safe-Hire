<div align="center">
  <img src="frontend/src/assets/safe-hire-brand.png" alt="SAFE HIRE Logo" width="380" />

  # SAFE HIRE v2.3
  
  **AI-Powered Job Scam & Corporate Legitimacy Verification Platform**

  [![Live App](https://img.shields.io/badge/🌐_Live_App-safe--hire--one.vercel.app-00dfa2?style=for-the-badge)](https://safe-hire-one.vercel.app/)
  [![Backend API](https://img.shields.io/badge/⚡_API_Server-safe--hire.onrender.com-0070f3?style=for-the-badge)](https://safe-hire.onrender.com/healthz)

  [![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
  [![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
  [![Flask](https://img.shields.io/badge/Flask-2.3+-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
  [![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-ML%20Ensemble-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-Cyber--Glassmorphism-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
  [![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

  <br />
  
  🚀 **Live Application:** [https://safe-hire-one.vercel.app/](https://safe-hire-one.vercel.app/)  
  ⚡ **Live API Service:** [https://safe-hire.onrender.com/](https://safe-hire.onrender.com/)
</div>

---

## 📌 Overview

**SAFE HIRE** is a production-grade cyber-intelligence and machine-learning platform engineered to protect job seekers, students, and professionals from recruitment fraud, fake appointment letters, and corporate impersonation schemes.

It integrates a multi-layered verification engine combining **NLP TF-IDF + Logistic Regression & Random Forest ML Ensembles**, real-time **Ministry of Corporate Affairs (MCA) Corporate Identification Number (CIN)** lookup across **7,99,384 legally registered entity records in South India (Tamil Nadu, Karnataka, Telangana, Kerala, Andhra Pradesh)**, **SSRF-hardened Job URL extraction**, **Offer Letter PDF forensic scanning**, and a **Verified Safe Companies Directory**.

---

## 🚀 Key Features & Capabilities

### 1. 🎯 Direct Job Legitimacy Verification
- **Hybrid ML Ensemble**: TF-IDF NLP token classification + Logistic Regression + Random Forest.
- **Government MCA CIN Registry Check**: Instant lookup of 21-character Corporate Identification Numbers with registered legal entity names.
- **South India MCA Coverage**: Cross-checks against **7,99,384 registered companies** across 5 states:
  - 🌴 **Tamil Nadu (TN)**: 2,28,400+ entities
  - 🏢 **Karnataka (KA)**: 2,17,700+ entities
  - 🚀 **Telangana (TG)**: 1,93,700+ entities
  - 🥥 **Kerala (KL)**: 99,800+ entities
  - 🌾 **Andhra Pradesh (AP)**: 59,700+ entities
- **Live Fraud Database**: Cross-references against verified scam company syndicates.
- **Interactive Test Presets**: 1-Click loading of real corporate jobs (with & without CIN) and scam samples.

### 2. 📜 Official Security Audit Certificate (PDF)
- **1-Click Printable PDF Certificate**: High-resolution audit document with tamper-evident certificate ID (`SH-AUDIT-YYYY-XXXXXX`).
- **Official Digital Seal**: Displays verification verdict (`APPROVED` / `REJECTED`), confidence gauge, risk tier (Low/Medium/High), MCA CIN match badge, and itemized forensic signals.

### 3. 📄 Offer Letter PDF & Document Forensic Scanner
- **PDF Upload & Text Drag-and-Drop**: Scans appointment letters using `pypdf` forensic extraction.
- **Fee Demand Detection**: Identifies illegal upfront registration charges, laptop caution deposits, training fees, and stamp paper extortion.
- **MNC Impersonation Defense**: Flags recruiters using generic webmail (`@gmail.com`, `@yahoo.com`) pretending to represent MNCs (TCS, Infosys, Wipro, Google, Microsoft, Amazon, etc.).
- **Coercive Threat Detection**: Catches high-pressure urgency ("pay within 24 hours", "police complaint").

### 4. 🌐 1-Click Job URL Auto-Fetcher
- **Automated Extraction**: Paste URLs from LinkedIn, Naukri, Indeed, or career portals to auto-fill company name, title, description, HR email, and domain.
- **SSRF Hardened**: Blocks private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`) and cloud metadata endpoints.

### 5. 🏛️ Verified Safe Companies Directory (7.99L+ South India MCA)
- **Instant Search & Filters**: Search legitimate companies by name, CIN, or state across 7.99L+ registered South Indian businesses.
- **Corporate Transparency**: View official CIN numbers, state jurisdictions, and active corporate standing directly from official MCA data.

### 6. 🔐 2-Step OTP Password Reset & Enterprise Security
- **Dual-Channel OTP Delivery**: Cryptographically secure 6-digit verification code dispatched via real SMTP Email or Mobile SMS with logo-branded HTML email template.
- **Security Protections**: Sliding-window rate limiter, Bcrypt password hashing, brute-force lockout, single-use OTP invalidation, and strict CSP headers.

### 7. 🛡️ 20/20 Production, SEO & Legal Compliance Checklist
- **SEO & Social Discovery**: Open Graph tags, Twitter Cards, `robots.txt`, and XML `sitemap.xml`.
- **Legal & DPDP Compliance**: Non-intrusive Privacy Policy (Zero Document Retention) & Terms of Service modals.
- **User Consent & Privacy**: `CookieBanner` for secure session token storage notification.
- **Resilience & UX**: Cyber-themed 404 Quarantine screen (`NotFound.tsx`) and high-contrast accessibility across all devices.
- **Official Cyber Defense Links**: National Cyber Crime Reporting Portal (`cybercrime.gov.in`) and 1930 Emergency Helpline integration in the global `Footer`.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Frontend UI** | React 18, TypeScript, Tailwind CSS | Cyber-Dark Glassmorphism responsive interface |
| **Backend API** | Python 3.11, Flask, Flask-CORS, Flask-JWT-Extended | RESTful architecture with defense-in-depth security |
| **Machine Learning & NLP** | scikit-learn, NLTK, NumPy, Pandas | TF-IDF vectorizer + Scaler + Logistic Regression + Random Forest |
| **Document Forensics** | PyPDF, BeautifulSoup4 | PDF text extraction & DOM parsing with SSRF protection |
| **Databases & Storage** | MCA Corporate Registries (7.99L CSV), Atomic JSON | Vectorized pandas lookup (<1.8s startup) & atomic JSON persistence |
| **Authentication** | JWT (256-bit), Bcrypt, Python `secrets` | Role-Based Access Control (RBAC) & 2-Step OTP Reset |

---

## 📜 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/predict` or `/api/predict` | Analyze company legitimacy & job description |
| `POST` | `/api/scan-offer-letter` | Forensic scan of offer letter PDF or pasted text |
| `POST` | `/api/fetch-job-url` | SSRF-safe 1-Click extraction from job URLs |
| `GET` | `/api/companies/search` | Search verified MCA companies by name/CIN & state |
| `GET` | `/api/companies/stats` | Retrieve total South India MCA registry statistics |
| `POST` | `/auth/register` | Register user with strong password policy |
| `POST` | `/auth/login` | Authenticate user & issue JWT token |
| `POST` | `/auth/send-otp` | Dispatch 6-digit OTP to Email or Phone |
| `POST` | `/auth/verify-otp-reset` | Verify OTP and reset password |
| `GET` | `/auth/me` | Retrieve authenticated user profile |
| `GET` | `/admin/analytics` | Admin-only dashboard analytics and logs |
| `POST` | `/api/visitors` | Thread-safe visitor counter |

---

## 🧪 Comprehensive Test Suite (16/16 Passed)

Run the end-to-end integration and security test suite:
```bash
cd backend
python test_backend.py
```

```
=================================================================
SAFE HIRE: COMPREHENSIVE SECURITY & INTEGRATION TEST SUITE (v2.3)
=================================================================
[Test 1] ML detector initialization .............. [PASS]
[Test 2] Security HTTP Headers (nosniff/CSP) ...... [PASS]
[Test 3] Visitors API counter ..................... [PASS]
[Test 4] Real Company with MCA CIN ................ [PASS]
[Test 5] Real Job without Email/Web ............... [PASS]
[Test 6] Known Scam Company Detection ............. [PASS]
[Test 7] Server-side Input Sanitization ........... [PASS]
[Test 8] Password Complexity Policy ............... [PASS]
[Test 9] User Authentication & Admin RBAC ......... [PASS]
[Test 10] Rate Limiting (Brute Force Protection) .. [PASS]
[Test 11] 2-Step OTP Password Reset (Email/Phone) . [PASS]
[Test 12] Offer Letter Fraud PDF Scanner .......... [PASS]
[Test 13] SSRF Hardening & Job URL Fetcher ........ [PASS]
[Test 14] Scam Alerts Database Retrieval ......... [PASS]
[Test 15] Scam Incident Reporting & Upvoting ...... [PASS]
[Test 16] Verified Safe Company Search & Stats .... [PASS]
=================================================================
ALL 16 COMPREHENSIVE SECURITY & FEATURE TESTS PASSED! [100% OK]
=================================================================
```

---

## 🚀 Quick Start (Local Run)

### Windows:
```powershell
.\start.bat
```

### macOS / Linux:
```bash
chmod +x start.sh
./start.sh
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API**: `http://localhost:5050`

---

## ☁️ Cloud Deployment & Architecture

### 1. Frontend: Vercel (0% Sleep · Global Edge CDN)
- **Live URL**: [https://safe-hire-one.vercel.app/](https://safe-hire-one.vercel.app/)
- **Framework Preset**: Create React App
- **Root Directory**: `frontend`
- **Build Command**: `GENERATE_SOURCEMAP=false npm run build`
- **Output Directory**: `build`
- **Integrated Telemetry**: Google Analytics 4 (`G-WV2KZR75ZJ`), Microsoft Clarity (`yf8d69cugl`), Schema.org JSON-LD Structured Data.

### 2. Backend: Render (24/7 Python Web Service)
- **Live API Endpoint**: [https://safe-hire.onrender.com/](https://safe-hire.onrender.com/)
- **Health Check**: [https://safe-hire.onrender.com/healthz](https://safe-hire.onrender.com/healthz)
- **Build Command**: `chmod +x build.sh && ./build.sh`
- **Start Command**: `gunicorn --chdir backend app:app --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 120`
- **Database Engine**: Compact indexed SQLite (`datasets/south_india_companies.db`) delivering high-throughput queries with an ultra-lightweight **~60MB RAM footprint** (100% stable on Free Tier).
- **Keep-Alive**: Configured with UptimeRobot automated 10-minute HTTP ping for 24/7 instant response.

---

## 📈 Search Console & Telemetry Integration

| Service | Status | Configuration / ID |
|---|---|---|
| **Google Search Console** | ✅ **Verified** | `googleb95b9efc22a41116.html` |
| **Sitemap XML** | ✅ **Indexed** | `https://safe-hire-one.vercel.app/sitemap.xml` |
| **Google Analytics (GA4)** | ✅ **Active** | Measurement ID `G-WV2KZR75ZJ` |
| **Microsoft Clarity** | ✅ **Active** | Project ID `yf8d69cugl` (Heatmaps & Session Replays) |
| **OpenGraph & Schema.org** | ✅ **Configured** | Rich Search Snippets & WhatsApp/LinkedIn Cards |

---

## 📄 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
