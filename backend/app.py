# ============================================================================
# MEMORY & THREAD FIX - MUST BE AT THE VERY TOP, BEFORE ANY OTHER IMPORTS
# ============================================================================
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['NUMEXPR_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
import pandas as pd
import numpy as np
import joblib
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
from scipy.sparse import hstack
import bcrypt
import pymongo
from datetime import datetime, timedelta
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-here')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)

# Emails allowed to hold the admin role, e.g. "owner@example.com,ops@example.com"
ADMIN_EMAILS = {
    email.strip().lower()
    for email in os.getenv('ADMIN_EMAILS', '').split(',')
    if email.strip()
}

def resolve_role(user):
    """An email in ADMIN_EMAILS is always treated as admin, even if the
    stored record predates the 'role' field or was edited by hand."""
    if user.get('email', '').lower() in ADMIN_EMAILS:
        return 'admin'
    return user.get('role', 'user')

# Enable CORS
CORS(app)

# Download NLTK data safely
NLTK_READY = True
for resource in ['punkt', 'stopwords', 'wordnet']:
    try:
        nltk.data.find(f'tokenizers/{resource}' if resource == 'punkt' else f'corpora/{resource}')
    except LookupError:
        try:
            nltk.download(resource, quiet=True)
        except Exception as e:
            print(f"WARNING: could not download NLTK '{resource}' ({type(e).__name__}). Falling back.")
            NLTK_READY = False

# ============================================================================
# LOAD TAMIL NADU COMPANY DATABASE
# ============================================================================
TN_COMPANIES_DB = None
TN_COMPANY_NAMES = set()

def load_tamil_nadu_database():
    """Load Tamil Nadu company registry from CSV"""
    global TN_COMPANIES_DB, TN_COMPANY_NAMES
    try:
        print("Loading Tamil Nadu company database...")
        TN_COMPANIES_DB = pd.read_csv('tamil_nadu_companies.csv')
        # Create a set of company names (normalized) for fast lookup
        TN_COMPANY_NAMES = {
            name.lower().strip() 
            for name in TN_COMPANIES_DB['Company Name'].dropna()
        }
        print(f"✓ Loaded {len(TN_COMPANY_NAMES)} Tamil Nadu registered companies")
        return True
    except Exception as e:
        print(f"WARNING: Could not load Tamil Nadu database ({type(e).__name__}). Registry checks disabled.")
        return False

def check_tamil_nadu_registry(company_name):
    """Check if company is registered in Tamil Nadu registry"""
    if not TN_COMPANY_NAMES:
        return None  # Database not loaded
    
    normalized_name = company_name.lower().strip()
    
    # Exact match
    if normalized_name in TN_COMPANY_NAMES:
        return True
    
    # Partial match (useful for similar names)
    for registered_name in TN_COMPANY_NAMES:
        if normalized_name in registered_name or registered_name in normalized_name:
            return True
    
    return False

# Load database on startup
load_tamil_nadu_database()

class JobFraudDetector:
    """Detects fraudulent job listings and companies"""
    def __init__(self):
        self.tfidf_vectorizer = None
        self.scaler = None
        self.logistic_model = None
        self.rf_model = None
        self.lemmatizer = WordNetLemmatizer()
        self.load_models()

    def load_models(self):
        """Load pre-trained ML models from disk"""
        try:
            self.tfidf_vectorizer = joblib.load('../ml_models/tfidf_vectorizer.joblib')
            self.scaler = joblib.load('../ml_models/scaler.joblib')
            self.logistic_model = joblib.load('../ml_models/logistic_model.joblib')
            self.rf_model = joblib.load('../ml_models/random_forest_model.joblib')
            print("✓ Models loaded successfully!")
        except Exception as e:
            print(f"WARNING: Could not load ML models ({type(e).__name__}). Using rule-based detection only.")
            self.tfidf_vectorizer = None
            self.scaler = None
            self.logistic_model = None
            self.rf_model = None

    def preprocess_text(self, text):
        """Basic text preprocessing"""
        if not text or not isinstance(text, str):
            return ""
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s]', '', text)
        tokens = text.split()
        
        # Only use stopwords if NLTK data is available
        if NLTK_READY:
            try:
                stop_words = set(stopwords.words('english'))
                tokens = [t for t in tokens if t not in stop_words]
                tokens = [self.lemmatizer.lemmatize(t) for t in tokens]
            except:
                pass
        
        return ' '.join(tokens)

    def extract_features(self, company_name, title, description, email, website):
        """Extract features for ML models"""
        features = {}
        
        def is_free_email(email_addr):
            """Check if email uses free provider (Gmail, Yahoo, etc)"""
            free_domains = {'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com'}
            if '@' in email_addr:
                domain = email_addr.split('@')[1].lower()
                return domain in free_domains
            return False

        def domain_mismatch(email_addr, website_url):
            """Check if email domain matches website domain"""
            if '@' not in email_addr or not website_url:
                return True
            email_domain = email_addr.split('@')[1].lower()
            website_domain = website_url.replace('https://', '').replace('http://', '').split('/')[0].lower()
            return email_domain not in website_domain and website_domain not in email_domain

        def is_generic_company(name):
            """Check if company name is too generic"""
            generic = {'global', 'hub', 'center', 'solutions', 'services', 'group', 'limited', 'inc', 'pvt'}
            name_lower = name.lower().split()
            return len(name_lower) <= 2 and any(g in name_lower for g in generic)

        def is_generic_title(title_text):
            """Check if job title is too generic"""
            generic_titles = {'data entry', 'work from home', 'easy job', 'earn money', 'make money'}
            return any(t in title_text.lower() for t in generic_titles)

        # Extract features
        features['free_email'] = 1 if is_free_email(email) else 0
        features['domain_mismatch'] = 1 if domain_mismatch(email, website) else 0
        features['generic_company'] = 1 if is_generic_company(company_name) else 0
        features['generic_title'] = 1 if is_generic_title(title) else 0
        features['no_website'] = 1 if not website else 0
        
        # Tamil Nadu registry check
        features['not_in_tn_registry'] = 0 if check_tamil_nadu_registry(company_name) else 1
        
        return features

    def calculate_suspicious_score(self, features):
        """Calculate rule-based suspicious score (0-10)"""
        scam_keywords = [
            'urgent', 'immediately', 'fast', 'easy', 'money', 'cash',
            'registration', 'fee', 'certificate', 'paid', 'profit',
            'guarantee', 'work from home', 'no experience', 'high salary'
        ]
        score = 0
        
        # Rule-based scoring
        score += features.get('free_email', 0) * 2
        score += features.get('domain_mismatch', 0) * 3
        score += features.get('generic_company', 0) * 2
        score += features.get('generic_title', 0) * 2
        score += features.get('no_website', 0) * 3
        score += features.get('not_in_tn_registry', 0) * 2  # Not in TN registry = suspicious
        
        return min(score, 10)

    def predict_record(self, company_name, title, description, email, website):
        """Main prediction method - returns confidence in legitimacy"""
        # Basic validation
        if not all([company_name, title, description, email]):
            return {
                'prediction': 'FAKE',
                'probability': 0.0,
                'risk_level': 'High',
                'suspicious_score': 10,
                'verification_status': 'REJECTED',
                'scam_status': 'Missing required fields',
                'tamil_nadu_registered': False
            }

        try:
            # Extract features
            features = self.extract_features(company_name, title, description, email, website)
            suspicious_score = self.calculate_suspicious_score(features)
            is_registered = check_tamil_nadu_registry(company_name)

            # Calculate confidence as inverse of suspicious score
            # 0/10 suspicious = 100% confidence, 10/10 = 0% confidence
            confidence_in_legitimate = (10 - suspicious_score) / 10.0
            
            # Determine prediction based on suspicious score
            if suspicious_score >= 5:
                return {
                    'prediction': 'FAKE',
                    'probability': confidence_in_legitimate,
                    'risk_level': 'High' if suspicious_score >= 7 else 'Medium',
                    'suspicious_score': suspicious_score,
                    'verification_status': 'REJECTED',
                    'scam_status': 'High risk indicators',
                    'tamil_nadu_registered': is_registered if is_registered is not None else 'Unknown'
                }
            else:
                return {
                    'prediction': 'REAL',
                    'probability': confidence_in_legitimate,
                    'risk_level': 'Low',
                    'suspicious_score': suspicious_score,
                    'verification_status': 'APPROVED',
                    'scam_status': 'No known issues',
                    'tamil_nadu_registered': is_registered if is_registered is not None else 'Unknown'
                }
        except Exception as e:
            print(f"Prediction error: {e}")
            return {
                'prediction': 'REAL',
                'probability': 0.5,
                'risk_level': 'Medium',
                'suspicious_score': 5,
                'verification_status': 'MANUAL_REVIEW',
                'scam_status': f'Error: {str(e)}',
                'tamil_nadu_registered': 'Unknown'
            }

# Initialize detector
try:
    detector = JobFraudDetector()
    print("✓ Fraud detector initialized!")
except Exception as e:
    print(f"ERROR initializing detector: {e}")
    detector = None

# ============================================================================
# VISITOR COUNTER
# ============================================================================
def load_visitors():
    """Load visitor count from file"""
    try:
        with open('visitors.json', 'r') as f:
            data = json.load(f)
            return data.get('count', 0)
    except:
        return 0

def save_visitors(count):
    """Save visitor count to file"""
    try:
        with open('visitors.json', 'w') as f:
            json.dump({'count': count, 'last_updated': str(datetime.now())}, f, indent=2)
    except:
        pass

# ============================================================================
# LOAD DATA
# ============================================================================
def load_users():
    """Load users from JSON file"""
    try:
        with open('users.json', 'r') as f:
            return json.load(f)
    except:
        return []

def save_users(users):
    """Save users to JSON file"""
    try:
        with open('users.json', 'w') as f:
            json.dump(users, f, indent=2, default=str)
    except:
        pass

def load_predictions():
    """Load predictions from JSON file"""
    try:
        with open('predictions.json', 'r') as f:
            return json.load(f)
    except:
        return []

def save_predictions(predictions):
    """Save predictions to JSON file"""
    try:
        with open('predictions.json', 'w') as f:
            json.dump(predictions, f, indent=2, default=str)
    except:
        pass

users_collection = load_users()
predictions_collection = load_predictions()

# ============================================================================
# API ROUTES
# ============================================================================

@app.route('/')
def home():
    return jsonify({"message": "SAFE HIRE API is running!"})

@app.route('/api/visitors', methods=['GET', 'POST'])
def visitors():
    """Get or increment visitor count"""
    try:
        count = load_visitors()
        if request.method == 'POST':
            count += 1
            save_visitors(count)
        return jsonify({"visitor_count": count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    """Predict if job/company listing is fake or real"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400

        required_fields = ['company_name', 'title', 'description', 'email', 'website']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        if not detector:
            return jsonify({"error": "Fraud detector not initialized"}), 500

        result = detector.predict_record(
            data['company_name'],
            data['title'],
            data['description'],
            data['email'],
            data['website']
        )

        prediction_record = {
            **data,
            **result,
            'timestamp': str(datetime.now())
        }
        predictions_collection.append(prediction_record)
        save_predictions(predictions_collection)

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        if not all(k in data for k in ['name', 'email', 'password']):
            return jsonify({"error": "Missing required fields"}), 400

        if any(u['email'] == data['email'] for u in users_collection):
            return jsonify({"error": "Email already registered"}), 400

        user = {
            'name': data['name'],
            'email': data['email'],
            'password': bcrypt.hashpw(data['password'].encode(), bcrypt.gensalt()).decode(),
            'role': 'user',
            'created_at': str(datetime.now())
        }
        users_collection.append(user)
        save_users(users_collection)

        return jsonify({"message": "Registration successful!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    """Login a user"""
    try:
        data = request.get_json()
        user = next((u for u in users_collection if u['email'] == data.get('email')), None)

        if not user or not bcrypt.checkpw(data.get('password', '').encode(), user['password'].encode()):
            return jsonify({"error": "Invalid credentials"}), 401

        access_token = create_access_token(identity=user['email'])
        return jsonify({
            "access_token": access_token,
            "user": {
                "name": user['name'],
                "email": user['email'],
                "role": resolve_role(user)
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/auth/me', methods=['GET'])
@jwt_required()
def me():
    """Get current user info"""
    try:
        email = get_jwt_identity()
        user = next((u for u in users_collection if u['email'] == email), None)
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({
            "name": user['name'],
            "email": user['email'],
            "role": resolve_role(user)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/admin/analytics', methods=['GET'])
@jwt_required()
def analytics():
    """Get analytics (admin only)"""
    try:
        email = get_jwt_identity()
        user = next((u for u in users_collection if u['email'] == email), None)
        if resolve_role(user) != 'admin':
            return jsonify({"error": "Unauthorized"}), 403

        total = len(predictions_collection)
        fake_count = len([p for p in predictions_collection if p.get('prediction') == 'FAKE'])
        real_count = total - fake_count

        return jsonify({
            "total_predictions": total,
            "risk_distribution": {
                "high": len([p for p in predictions_collection if p.get('risk_level') == 'High']),
                "medium": len([p for p in predictions_collection if p.get('risk_level') == 'Medium']),
                "low": len([p for p in predictions_collection if p.get('risk_level') == 'Low'])
            },
            "predictions_summary": {"REAL": real_count, "FAKE": fake_count}
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# STARTUP
# ============================================================================
if __name__ == '__main__':
    print("=" * 60)
    print("SAFE HIRE - Fake Job Detection System")
    print("=" * 60)
    print(f"Loaded {len(users_collection)} users")
    print(f"Loaded {len(predictions_collection)} predictions")
    print("=" * 60)
    app.run(debug=False, port=5050, host='127.0.0.1')
