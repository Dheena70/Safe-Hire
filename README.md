<div align="center">
  <img src="frontend/src/assets/safe-hire-brand.png" alt="SAFE HIRE Logo" width="380" />

  # SAFE HIRE
  
  **AI-Powered Job Scam & Corporate Legitimacy Verification Platform**

  [![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
  [![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
  [![Flask](https://img.shields.io/badge/Flask-2.3+-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
  [![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-ML%20Ensemble-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-Cyber--Glassmorphism-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
  [![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
</div>

---

## 📌 Overview

**SAFE HIRE** is a production-grade cyber-intelligence and machine-learning platform designed to safeguard job seekers against employment fraud, fake job offers, and impersonation schemes.

It combines **NLP TF-IDF + Logistic Regression & Random Forest ML Ensembles** with official **Ministry of Corporate Affairs (MCA) Corporate Identification Number (CIN)** verification, regional registries (~228,000 corporate records), and live fraud databases.

---

## ✨ Key Features

- 🛡️ **Hybrid ML & Heuristic Scoring Engine**: Combines NLP TF-IDF text classification with domain heuristics for high-accuracy fraud detection.
- 🏷️ **Official MCA CIN Verification**: Instant cross-referencing of 21-character Corporate Identification Numbers with registered legal entity names.
- 🏛️ **MCA & Regional Registry Lookup**: Validates corporate identity against extensive company records.
- 🚨 **Live Scam Database Cross-Check**: Real-time matching against reported fraudulent company listings.
- 🌐 **Domain & Email Consistency Verification**: Detects free email providers (Gmail, Yahoo) and website-email domain mismatches.
- 📄 **Optional Contact Email & Website**: Full verification available using only Company Name, Job Title, and Description.
- 📊 **Animated Legitimacy Gauge & Forensic Audit**: Real-time confidence score (0–100%), risk tiers (Low/Medium/High), and 1-click `.txt` audit report exporter.
- 🔐 **Secure JWT Authentication & Role-Based Access**: 256-bit JWT authentication with Bcrypt password encryption.
- 📈 **Real-Time Admin Intelligence Dashboard**: Analytics, risk distributions, and recent verification history.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Frontend UI** | React 18, TypeScript, Tailwind CSS, Cyber-Glassmorphism |
| **Backend API** | Python 3.11, Flask, Flask-CORS, Flask-JWT-Extended, Gunicorn |
| **Machine Learning & NLP** | scikit-learn (TF-IDF, Logistic Regression, Random Forest), NLTK, NumPy, Pandas |
| **Databases & Storage** | MCA Corporate Registries (CSV), Thread-Safe Atomic JSON |
| **DevOps & Hosting** | Procfile, Docker, Vercel SPA Config, Render Gunicorn Service |

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

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:5050`

---

## ☁️ 1-Step Cloud Hosting (Render.com)

1. Connect your GitHub repository to [Render.com](https://dashboard.render.com/).
2. Select **Web Service**:
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `gunicorn --chdir backend app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
3. Add Environment Variables:
   - `JWT_SECRET_KEY` = `your-secret-key`
   - `ADMIN_EMAILS` = `admin@example.com`

---

## 📜 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/predict` | Analyze company, CIN, job description & offer details |
| `POST` | `/auth/register` | Register a new user account |
| `POST` | `/auth/login` | Authenticate user & receive JWT access token |
| `GET` | `/auth/me` | Fetch current user session profile |
| `GET` | `/admin/analytics` | Fetch admin analytics & recent verification logs |
| `POST` | `/api/visitors` | Atomic visitor tracking counter |

---

## 📄 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
