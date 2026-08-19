# SAFE HIRE

SAFE HIRE is a full-stack company verification and fake-job detection platform. It combines machine-learning predictions with rule-based checks to help users identify suspicious companies and job offers before sharing personal information.

## Features

- Company and job-offer risk prediction with `REAL` or `FAKE` results
- Confidence score and low, medium, or high risk classification
- TF-IDF text analysis with Logistic Regression and Random Forest models
- Tamil Nadu company registry lookup
- Scam-company dataset comparison
- Email-domain and website validation checks
- User registration and JWT-based login
- Admin analytics dashboard with prediction and risk statistics

## Technology Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Axios
- **Backend:** Python, Flask, Flask-CORS, Flask-JWT-Extended
- **Machine learning:** scikit-learn, pandas, NumPy, NLTK, joblib
- **Data:** CSV datasets and JSON application storage

## Project Structure

```text
SAFE_HIRE/
├── backend/       # Flask API, datasets, and model training code
├── frontend/      # React and TypeScript application
├── datasets/      # Sample company and scam datasets
├── ml_models/     # Trained model artifacts
├── start.bat      # Start both services on Windows
├── start.sh       # Start both services on macOS/Linux
└── README.md
```

## Requirements

- Python 3.8 or newer
- Node.js 16 or newer
- npm

## Run Locally

### Windows

From the project root, double-click `start.bat`, or run:

```powershell
.\start.bat
```

### macOS/Linux

```bash
chmod +x start.sh
./start.sh
```

The services are then available at:

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:5050>

### Manual setup

Install backend dependencies:

```bash
cd backend
python -m pip install -r requirements.txt
python app.py
```

In a second terminal, install and start the frontend:

```bash
cd frontend
npm install
npm start
```

The backend loads the trained models from `ml_models/` when they are available. To retrain them, run:

```bash
cd backend
python train_models.py
```

## Configuration

The backend reads environment variables from `backend/.env`:

```env
JWT_SECRET_KEY=replace-with-a-long-random-secret
ADMIN_EMAILS=admin@example.com
```

Do not commit `.env`, passwords, API keys, or real user data to GitHub. Keep private files such as `backend/users.json` and `backend/visitors.json` out of public repositories when they contain personal information.

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/predict` | Analyze a company or job offer |
| `POST` | `/auth/register` | Register a user |
| `POST` | `/auth/login` | Authenticate a user |
| `GET` | `/auth/me` | Get the authenticated user |
| `GET` | `/admin/analytics` | Get admin dashboard statistics |
| `POST` | `/api/visitors` | Update and return visitor count |

## How Detection Works

1. The user submits company, job, email, and website details.
2. The backend extracts text and metadata features.
3. ML models evaluate the description and structured features.
4. Registry, scam-list, email, website, and rule-based checks add verification signals.
5. SAFE HIRE returns a prediction, confidence score, risk level, and supporting status details.

Results are decision-support signals and should be checked against official sources before making an employment or financial decision.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Author

Developed as a full-stack machine-learning project for safer company and job-offer verification.
