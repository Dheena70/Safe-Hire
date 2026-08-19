# SAFE HIRE - Startup Guide

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (optional, falls back to in-memory storage)

### Backend Setup

1. **Install Python Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Train ML Models**
   ```bash
   python train_models.py
   ```
   This will create trained models in the `ml_models/` directory.

3. **Set Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configurations
   ```

4. **Start Backend Server**
   ```bash
   python app.py
   ```
   Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Install Node Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```
   Frontend will run on `http://localhost:3000`

## 📱 Application Features

### User Module
- **Registration/Login**: Create account or sign in
- **Verification Form**: Enter company details and get instant verification
- **Real-time Results**: See prediction, confidence score, and risk level

### Admin Module
- **Analytics Dashboard**: View statistics and trends
- **Recent Predictions**: Monitor latest verification requests
- **Risk Distribution**: See breakdown of risk levels

### ML Detection Features
- **Text Analysis**: NLP-based description analysis
- **Email Verification**: Detect free email providers
- **Website Validation**: Check domain authenticity
- **MCA Database**: Cross-reference with registered companies
- **Scam Detection**: Check against known fraudulent companies

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Verification
- `POST /predict` - Verify job/company

### Admin
- `GET /admin/analytics` - Get dashboard analytics

## 📊 Sample Test Data

### Legitimate Companies (Should return REAL)
- **Company**: Microsoft India
- **Title**: Software Development Intern
- **Email**: careers@microsoft.com
- **Website**: https://www.microsoft.com

### Suspicious Companies (Should return FAKE)
- **Company**: Quick Money Solutions
- **Title**: Work From Home Intern
- **Email**: quickmoney@gmail.com
- **Website**: (empty)

## 🛡️ Security Features

- JWT Authentication
- Password Hashing
- Input Validation
- CORS Protection
- Rate Limiting Ready

## 📁 Project Structure

```
SAFE HIRE/
├── backend/                 # Flask API
│   ├── app.py              # Main application
│   ├── train_models.py     # ML training script
│   └── requirements.txt    # Python dependencies
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   └── services/       # API services
│   └── package.json        # Node dependencies
├── ml_models/              # Trained ML models
├── datasets/               # Sample datasets
└── README.md              # Project documentation
```

## 🔍 How It Works

1. **User Input**: Enter company details in verification form
2. **Feature Extraction**: Extract relevant features from text and metadata
3. **ML Prediction**: Run through trained models (Logistic Regression + Random Forest)
4. **Rule-Based Checks**: MCA database, scam list, email/website validation
5. **Risk Scoring**: Calculate comprehensive risk score
6. **Result Display**: Show prediction with confidence and reasoning

## 🚀 Deployment

### Backend Deployment (Render/Railway)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy Python app

### Frontend Deployment (Vercel/Netlify)
1. Connect your GitHub repository
2. Configure build settings
3. Deploy React app

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review API documentation
- Create an issue on GitHub

## 🎯 Next Steps

- Add more ML models
- Expand MCA database
- Implement rate limiting
- Add email notifications
- Create mobile app
- Add more analytics features
