<div align="center">
  <img src="frontend/src/assets/safe-hire-brand.png" alt="SAFE HIRE Logo" width="380" />

  # SAFE HIRE (v2.2)
  
  **Production-Grade AI Fraud Intelligence, Offer Letter Forensics & Company Legitimacy Verification Platform**

  [![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
  [![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
  [![Flask](https://img.shields.io/badge/Flask-2.3+-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
  [![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-ML%20Ensemble-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-Cyber--Glassmorphism-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
  [![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
</div>

---

## 📌 Overview

**SAFE HIRE** is an advanced, production-grade cyber-intelligence and machine learning platform created to protect job seekers against fraudulent recruitment syndicates, predatory fee extortions, and corporate impersonation schemes.

The platform fuses **NLP TF-IDF + Logistic Regression & Random Forest ML Ensembles** with official **Ministry of Corporate Affairs (MCA) Corporate Identification Number (CIN)** lookup, regional company registries (~228,000 records), live document forensics, and a crowd-sourced fraud registry.

---

## 🌟 What's New in v2.2 (Major Power Upgrades)

### 1. 📜 Download Official Security Audit Certificate (PDF)
- **High-Resolution Tamper-Evident Report**: Instant client-side generation of an official printable certificate with zero third-party dependencies.
- **Verification Stamp & Authenticity Key**: Features unique Audit ID (`SH-AUDIT-YYYY-XXXXXX`), timestamp, AI legitimacy verdict (`APPROVED` / `REJECTED`), threat rating, legitimacy gauge, MCA CIN match, and forensic signal breakdown.

### 2. 📄 Offer Letter PDF & Document Forensic Scanner (`/api/scan-offer-letter`)
- **PDF Upload & Drag-and-Drop**: Upload appointment letters (.pdf / .txt) or paste offer transcripts.
- **Deep Forensic Rules**:
  - **Upfront Fee Demands**: Detects laptop deposits, training fees, caution deposits, and registration charges.
  - **MNC Webmail Impersonation**: Flags generic public emails (`@gmail.com`, `@yahoo.com`) pretending to recruit for top MNCs (TCS, Infosys, Wipro, Google, Microsoft, Amazon, etc.).
  - **Coercive Threats**: Flags high-pressure extortion clauses (*"payment within 24 hours"*, *"legal notice"*).
  - **MCA CIN Extraction**: Extracts 21-character CIN numbers directly from the document.

### 3. 🌐 1-Click Job URL Auto-Fetcher (`/api/fetch-job-url`)
- **Auto-Extraction**: Paste URLs from LinkedIn, Naukri, Indeed, Glassdoor, or corporate career sites to auto-populate company name, job designation, description, email, and website.
- **SSRF Hardening (Server-Side Request Forgery)**: Blocks internal subnets (`127.0.0.0/8`, `10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`) and cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`).

### 4. 🚨 Community Scam Alert Board & Live Feed (`/api/scams`)
- **Live Fraud Feed**: Crowd-sourced registry of verified recruitment scams, fake Telegram tasks, and fraudulent consultancies.
- **Search & Category Filters**: Search by keyword or filter by `Data Entry`, `Telegram Task`, `Fake MNC`, `Abroad Job`, `Fee Demand`.
- **Upvoting & Reporting**: Submit new fraud incidents and upvote existing alerts to protect the job seeker community.

### 5. 🔐 2-Step 6-Digit OTP Password Reset Flow
- **Cryptographic Entropy**: Dispatches 6-digit numeric verification codes with a 2-minute TTL.
- **Dual Delivery**: Supports verified delivery via registered **Email Address** and **Mobile Phone Number**.
- **Brute-Force & Replay Protection**: Throttled to 5 attempts, constant-time verification (`secrets.compare_digest`), and single-use token invalidation.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Frontend UI** | React 18, TypeScript, Tailwind CSS | Cyber-Glassmorphism Dark Theme (`slate-950`, `cyan-400`) |
| **Backend API** | Python 3.11, Flask, Gunicorn | Secure RESTful API with CORS preflight & rate limiting |
| **Document Forensics** | PyPDF, BeautifulSoup4 | PDF text extraction and OpenGraph metadata parsing |
| **Machine Learning & NLP** | scikit-learn, NLTK, NumPy, Pandas | TF-IDF vectorization, Logistic Regression, Random Forest Ensemble |
| **Corporate Databases** | MCA Registry (CSV), JSON | 228,000+ registered entities and thread-safe atomic storage |
| **Security & Auth** | Flask-JWT-Extended, Bcrypt, Secrets | 256-bit JWTs, Bcrypt hashing, SSRF prevention, CSP headers |

---

## 📜 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/predict` or `/api/predict` | Run AI ensemble, MCA CIN lookup & legitimacy prediction |
| `POST` | `/api/scan-offer-letter` | Scan uploaded offer letter PDF or text for fraud signatures |
| `POST` | `/api/fetch-job-url` | Auto-extract job details from LinkedIn, Naukri, Indeed URLs |
| `GET` | `/api/scams` | Fetch community scam alerts with search & category filters |
| `POST` | `/api/scams/report` | Submit a new scam incident to the alert board |
| `POST` | `/api/scams/<id>/vote` | Upvote a scam alert to confirm community consensus |
| `POST` | `/auth/register` | Register a new user account with password policy checks |
| `POST` | `/auth/login` | Authenticate user & issue 24-hour JWT token |
| `POST` | `/auth/send-otp` | Generate & dispatch 6-digit OTP to Email or Phone |
| `POST` | `/auth/verify-otp-reset` | Verify 6-digit OTP & update user password |
| `GET` | `/auth/me` | Fetch authenticated user profile details |
| `GET` | `/admin/analytics` | Fetch admin fraud metrics, distributions & audit logs |
| `POST` | `/api/visitors` | Atomic visitor tracking counter |

---

## 🧪 Comprehensive Verification & Test Suite

The system includes an automated 15-test security and functional test suite:

```bash
cd backend
python test_backend.py
```

```
=================================================================
SAFE HIRE: COMPREHENSIVE SECURITY & INTEGRATION TEST SUITE (v2.2)
=================================================================
[Test 1] Checking ML detector initialization ......... [PASS]
[Test 2] Testing Security HTTP Headers ................ [PASS]
[Test 3] Testing POST /api/visitors ................... [PASS]
[Test 4] Testing POST /predict (Real Company + CIN) ... [PASS]
[Test 5] Testing POST /predict (No Email/Website) ..... [PASS]
[Test 6] Testing POST /predict (Known Scam Company) ... [PASS]
[Test 7] Testing Input Validation & Sanitization ...... [PASS]
[Test 8] Testing Password Complexity Policy .......... [PASS]
[Test 9] Testing User Auth & Admin RBAC ............... [PASS]
[Test 10] Testing Rate Limiting on Auth ............... [PASS]
[Test 11] Testing 2-Step OTP Password Reset (Email/SMS) [PASS]
[Test 12] Testing POST /api/scan-offer-letter ........ [PASS]
[Test 13] Testing POST /api/fetch-job-url SSRF Guard .. [PASS]
[Test 14] Testing GET /api/scams ...................... [PASS]
[Test 15] Testing POST /api/scams/report & Upvoting ... [PASS]
=================================================================
ALL 15 COMPREHENSIVE SECURITY & FEATURE TESTS PASSED! [100% OK]
=================================================================
```

---

## 🚀 Quick Start (Local Run)

### 1. Clone the Repository
```bash
git clone https://github.com/Dheena70/Safe-Hire.git
cd Safe-Hire
```

### 2. Windows 1-Click Launch:
```powershell
.\start.bat
```

### 3. macOS / Linux Launch:
```bash
chmod +x start.sh
./start.sh
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API**: `http://localhost:5050`

---

## ☁️ 1-Step Cloud Hosting (Render.com)

1. Connect your GitHub repository to [Render.com](https://dashboard.render.com/).
2. Select **Web Service**:
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `gunicorn --chdir backend app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
3. Add Environment Variables:
   - `JWT_SECRET_KEY` = `your-cryptographic-secret`
   - `ADMIN_EMAILS` = `admin@example.com`
   - `SMTP_USERNAME` = `your-email@gmail.com` *(optional for live OTP email delivery)*
   - `SMTP_PASSWORD` = `your-gmail-app-password` *(optional)*

---

## 📄 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
