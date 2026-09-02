# ============================================================================
# MEMORY & THREAD FIX - MUST BE AT THE VERY TOP, BEFORE ANY OTHER IMPORTS
# ============================================================================
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['NUMEXPR_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'

import re
import json
import threading
import tempfile
from datetime import datetime, timedelta

import bcrypt
import joblib
import nltk
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from scipy.sparse import hstack
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler

# Base directory paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, '..', 'ml_models')
DATASETS_DIR = os.path.join(BASE_DIR, '..', 'datasets')
USERS_FILE = os.path.join(BASE_DIR, 'users.json')
PREDICTIONS_FILE = os.path.join(BASE_DIR, 'predictions.json')
VISITORS_FILE = os.path.join(BASE_DIR, 'visitors.json')

# Load environment variables
load_dotenv(os.path.join(BASE_DIR, '.env'))

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'safe-hire-production-secret-key-change-in-env')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)

# Allowed admin emails
ADMIN_EMAILS = {
    email.strip().lower()
    for email in os.getenv('ADMIN_EMAILS', 'admin@example.com').split(',')
    if email.strip()
}

def resolve_role(user):
    """Determine role based on ADMIN_EMAILS or record"""
    if not user:
        return 'user'
    if user.get('email', '').lower() in ADMIN_EMAILS:
        return 'admin'
    return user.get('role', 'user')

# Enable CORS for frontend
CORS(app)

# Threading locks for data safety
users_lock = threading.Lock()
predictions_lock = threading.Lock()
visitors_lock = threading.Lock()

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
# ATOMIC JSON STORAGE HELPERS
# ============================================================================
def atomic_save_json(filepath, data):
    """Thread-safe and atomic file persistence using a temp file"""
    try:
        dir_name = os.path.dirname(filepath)
        with tempfile.NamedTemporaryFile('w', dir=dir_name, delete=False, encoding='utf-8') as tf:
            json.dump(data, tf, indent=2, default=str)
            temp_name = tf.name
        # Atomic rename/replace
        os.replace(temp_name, filepath)
        return True
    except Exception as e:
        print(f"ERROR saving {filepath}: {e}")
        return False

def load_json_safe(filepath, default_val):
    """Safely load JSON data from disk"""
    if not os.path.exists(filepath):
        return default_val
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"WARNING reading {filepath}: {e}")
        return default_val

# ============================================================================
# LOAD SCAM AND COMPANY REGISTRY DATABASES WITH CIN SUPPORT
# ============================================================================
SCAM_COMPANIES_DB = {}
TN_COMPANY_NAMES = set()
TN_CIN_MAP = {}  # CIN (uppercase) -> Company Name

GENERIC_CORP_SUFFIXES = {
    'pvt', 'ltd', 'limited', 'inc', 'incorporated', 'corp', 'corporation',
    'llp', 'technologies', 'technology', 'solutions', 'services', 'enterprises',
    'global', 'consulting', 'group', 'india', 'international', 'co', 'company'
}

def load_scam_database():
    """Load known fraudulent companies database"""
    global SCAM_COMPANIES_DB
    scam_csv_path = os.path.join(DATASETS_DIR, 'sample_scam_companies.csv')
    try:
        if os.path.exists(scam_csv_path):
            df = pd.read_csv(scam_csv_path, on_bad_lines='skip')
            for _, row in df.iterrows():
                name = str(row.get('company_name', '')).strip().lower()
                if name:
                    SCAM_COMPANIES_DB[name] = {
                        'reason': str(row.get('reason', 'Reported fake job offers')),
                        'category': str(row.get('category', 'Employment Scam')),
                        'reported_date': str(row.get('reported_date', 'Unknown'))
                    }
            print(f"[OK] Loaded {len(SCAM_COMPANIES_DB)} known scam companies from database")
    except Exception as e:
        print(f"WARNING: Could not load scam database ({e})")

def check_scam_database(company_name):
    """Check if company name matches known fraudulent company listings"""
    if not company_name or not SCAM_COMPANIES_DB:
        return None

    clean_input = company_name.lower().strip()
    # Exact match
    if clean_input in SCAM_COMPANIES_DB:
        return SCAM_COMPANIES_DB[clean_input]

    # Clean input tokens without punctuation
    input_tokens = set(re.findall(r'[a-z0-9]+', clean_input)) - GENERIC_CORP_SUFFIXES
    if not input_tokens:
        return None

    for scam_name, scam_info in SCAM_COMPANIES_DB.items():
        scam_tokens = set(re.findall(r'[a-z0-9]+', scam_name)) - GENERIC_CORP_SUFFIXES
        if scam_tokens and scam_tokens == input_tokens:
            return scam_info

    return None

def load_company_databases():
    """Load Tamil Nadu and MCA company registries with CIN mapping"""
    global TN_COMPANY_NAMES, TN_CIN_MAP
    try:
        # 1. Load sample MCA dataset for major multi-state corporate CINs
        mca_csv_path = os.path.join(DATASETS_DIR, 'sample_mca_companies.csv')
        if os.path.exists(mca_csv_path):
            df_mca = pd.read_csv(mca_csv_path, on_bad_lines='skip')
            for _, r in df_mca.iterrows():
                cname = str(r.get('company_name', '')).strip()
                cin = str(r.get('cin', '')).strip().upper()
                if cname:
                    TN_COMPANY_NAMES.add(cname.lower())
                if cin:
                    TN_CIN_MAP[cin] = cname

        # 2. Load Tamil Nadu large registry
        tn_csv_path = os.path.join(DATASETS_DIR, 'tamil_nadu_companies.csv')
        if os.path.exists(tn_csv_path):
            print(f"Loading company registry from {os.path.basename(tn_csv_path)}...")
            df = pd.read_csv(tn_csv_path, low_memory=False, on_bad_lines='skip')
            
            cin_col = 'CIN' if 'CIN' in df.columns else None
            name_col = 'Company Name' if 'Company Name' in df.columns else df.columns[0]

            for _, row in df[[cin_col, name_col]].dropna(subset=[name_col]).iterrows() if cin_col else df[[name_col]].dropna().iterrows():
                name = str(row[name_col]).strip()
                TN_COMPANY_NAMES.add(name.lower())
                if cin_col:
                    cin_val = str(row[cin_col]).strip().upper()
                    if cin_val and cin_val != 'NAN':
                        TN_CIN_MAP[cin_val] = name

            print(f"[OK] Loaded {len(TN_COMPANY_NAMES)} registered companies ({len(TN_CIN_MAP)} with CIN)")
            return True
        else:
            print("WARNING: Company registry file not found.")
            return False
    except Exception as e:
        print(f"WARNING: Could not load company registry ({e}). Registry checks disabled.")
        return False

def check_cin_registry(cin):
    """Check if CIN exists in official database"""
    if not cin:
        return None, None
    clean_cin = str(cin).strip().upper()
    if clean_cin in TN_CIN_MAP:
        return True, TN_CIN_MAP[clean_cin]
    
    # Check if format matches valid 21-character alphanumeric MCA pattern
    if re.match(r'^[LUu][0-9]{5}[A-Za-z]{2}[0-9]{4}[A-Za-z]{3}[0-9]{6}$', clean_cin):
        return 'UNVERIFIED_REGIONAL', None
    
    return False, None

def check_tamil_nadu_registry(company_name):
    """Check if company is verified in official registry (with false-positive protection)"""
    if not TN_COMPANY_NAMES or not company_name:
        return None

    normalized_name = company_name.lower().strip()

    # Exact full match
    if normalized_name in TN_COMPANY_NAMES:
        return True

    # Token match protection - remove generic corporate suffixes
    tokens = [t for t in re.findall(r'[a-z0-9]+', normalized_name) if t not in GENERIC_CORP_SUFFIXES]
    if len(tokens) >= 2:
        token_phrase = ' '.join(tokens)
        if any(token_phrase in reg_name for reg_name in TN_COMPANY_NAMES if len(reg_name) <= len(token_phrase) + 30):
            return True

    return False

# Load databases on startup
load_scam_database()
load_company_databases()

# ============================================================================
# FRAUD DETECTOR WITH HYBRID ML + RULE-BASED ENGINE
# ============================================================================
class JobFraudDetector:
    """Combines NLP TF-IDF Ensemble Models with Domain Rule Heuristics"""
    def __init__(self):
        self.tfidf_vectorizer = None
        self.scaler = None
        self.logistic_model = None
        self.rf_model = None
        self.lemmatizer = WordNetLemmatizer()
        try:
            self.stop_words = set(stopwords.words('english'))
        except Exception:
            self.stop_words = set()

        self.suspicious_keywords = [
            'urgent', 'immediate', 'work from home', 'no experience', 'earn money',
            'quick money', 'easy money', 'payment required', 'training fee',
            'deposit', 'investment', 'unlimited earning', 'guaranteed job',
            'no interview', 'immediate hiring', 'start today', 'weekly payment',
            'daily payment', 'data entry', 'form filling', 'ad posting', 'click ads',
            'survey', 'registration fee', 'part time job', 'earn per day', 'zero investment',
            'processing fee', 'security deposit', 'wire transfer', 'crypto', 'gift card'
        ]

        self.professional_keywords = [
            'software development', 'machine learning', 'data science', 'web development',
            'mobile development', 'cloud computing', 'devops', 'cybersecurity',
            'artificial intelligence', 'deep learning', 'backend', 'frontend',
            'full stack', 'database', 'api development', 'testing', 'ui/ux',
            'project management', 'business analysis', 'marketing', 'sales',
            'human resources', 'finance', 'accounting', 'research', 'analytics',
            'bachelor', 'master', 'degree', 'responsibilities', 'qualifications',
            'collaborate', 'agile', 'scrum', 'architecture', 'infrastructure'
        ]

        self.load_models()

    def load_models(self):
        """Load trained ML models from ml_models directory"""
        try:
            tfidf_path = os.path.join(MODELS_DIR, 'tfidf_vectorizer.joblib')
            scaler_path = os.path.join(MODELS_DIR, 'scaler.joblib')
            if not os.path.exists(scaler_path):
                scaler_path = os.path.join(MODELS_DIR, 'meta_scaler.joblib')

            lr_path = os.path.join(MODELS_DIR, 'logistic_model.joblib')
            rf_path = os.path.join(MODELS_DIR, 'rf_model.joblib')
            if not os.path.exists(rf_path):
                rf_path = os.path.join(MODELS_DIR, 'random_forest_model.joblib')

            if os.path.exists(tfidf_path) and os.path.exists(lr_path) and os.path.exists(rf_path):
                self.tfidf_vectorizer = joblib.load(tfidf_path)
                self.scaler = joblib.load(scaler_path)
                self.logistic_model = joblib.load(lr_path)
                self.rf_model = joblib.load(rf_path)
                print("[OK] ML models (TF-IDF, Scaler, Logistic Regression, Random Forest) loaded successfully!")
            else:
                print("INFO: ML model files not yet trained. Run python train_models.py to enable ML scoring.")
        except Exception as e:
            print(f"WARNING: Could not load ML models ({type(e).__name__}: {e}). Using heuristic mode.")

    def preprocess_text(self, text):
        """Clean and normalize textual content"""
        if not text or not isinstance(text, str):
            return ""
        text = text.lower()
        text = re.sub(r'[^a-zA-Z\s]', ' ', text)
        words = text.split()
        if self.stop_words:
            words = [self.lemmatizer.lemmatize(w) for w in words if w not in self.stop_words]
        else:
            words = [self.lemmatizer.lemmatize(w) for w in words]
        return ' '.join(words)

    def extract_features(self, company_name, title, description, email='', website=''):
        """Extract structured features for heuristic and ML scoring (email & website are optional)"""
        features = {}

        clean_desc = self.preprocess_text(description)
        clean_title = self.preprocess_text(title)
        clean_company = self.preprocess_text(company_name)

        # Keyword counts
        features['suspicious_keyword_count'] = sum(1 for kw in self.suspicious_keywords if kw in clean_desc)
        features['professional_keyword_count'] = sum(1 for kw in self.professional_keywords if kw in clean_desc)

        # Text lengths
        features['description_length'] = len(str(description or ''))
        features['title_length'] = len(str(title or ''))
        features['company_name_length'] = len(str(company_name or ''))

        # Free email provider check (Only evaluated if email is provided)
        free_domains = {'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediff.com', 'aol.com', 'mail.com'}
        email_str = str(email or '').strip().lower()
        if email_str and '@' in email_str:
            domain = email_str.split('@')[-1]
            features['is_free_email'] = 1 if domain in free_domains else 0
            features['email_provided'] = 1
        else:
            features['is_free_email'] = 0  # Neutral when omitted
            features['email_provided'] = 0

        # Website check
        web_str = str(website or '').strip().lower()
        has_web = 1 if web_str and web_str not in {'none', 'null', 'n/a', ''} else 0
        features['has_website'] = has_web

        # Domain mismatch check (Only evaluated if BOTH email and website are provided)
        if features['email_provided'] and has_web:
            email_domain = email_str.split('@')[-1].strip()
            clean_web = web_str.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0].strip()
            features['domain_mismatch'] = 0 if (email_domain in clean_web or clean_web in email_domain) else 1
        else:
            features['domain_mismatch'] = 0  # Neutral when omitted

        # Generic company check
        generic_patterns = {'consulting', 'services', 'solutions', 'technologies', 'global', 'hub', 'centre', 'enterprises'}
        words = set(clean_company.split())
        features['is_generic_company'] = 1 if len(words) <= 2 and any(w in generic_patterns for w in words) else 0

        # Generic title check
        suspicious_titles = {'data entry', 'work from home', 'easy job', 'earn money', 'form filling', 'ad posting', 'survey'}
        t_lower = str(title or '').lower()
        features['is_generic_title'] = 1 if any(st in t_lower for st in suspicious_titles) else 0

        return features, f"{clean_title} {clean_company} {clean_desc}"

    def calculate_heuristic_score(self, features, scam_match, is_registered, cin_status, cin_registered_name, company_name):
        """Calculate rule-based suspicion score (0-10) and diagnostic reasons"""
        score = 0
        reasons = []

        # 1. Scam database cross-check
        if scam_match:
            score += 8
            reasons.append(f"Company matches known fraudulent records: {scam_match['reason']}")

        # 2. CIN (Corporate Identification Number) verification
        if cin_status is True:
            # Check name consistency
            c_clean = company_name.lower().strip()
            r_clean = (cin_registered_name or '').lower().strip()
            c_tokens = set(re.findall(r'[a-z0-9]+', c_clean)) - GENERIC_CORP_SUFFIXES
            r_tokens = set(re.findall(r'[a-z0-9]+', r_clean)) - GENERIC_CORP_SUFFIXES

            if c_tokens and r_tokens and (c_tokens.issubset(r_tokens) or r_tokens.issubset(c_tokens) or len(c_tokens & r_tokens) >= 1):
                score = max(0, score - 3)
                reasons.append(f"Official MCA Corporate Identification Number (CIN) verified for '{cin_registered_name}'")
            else:
                score += 1
                reasons.append(f"CIN is officially registered to '{cin_registered_name}' (verify company name consistency)")
        elif cin_status == 'UNVERIFIED_REGIONAL':
            reasons.append("Valid 21-character CIN format provided, but not found in regional registry")
        elif cin_status is False:
            reasons.append("Provided CIN does not match standard 21-character MCA CIN format")

        # 3. Email diagnostics (if provided)
        if features.get('email_provided'):
            if features['is_free_email']:
                score += 2
                reasons.append("Contact email uses a free/public email provider (e.g. Gmail/Yahoo) instead of corporate domain")
            elif not features['domain_mismatch'] and features['has_website']:
                score = max(0, score - 1)
                reasons.append("Email domain successfully matches official company website domain")
            
            if features['domain_mismatch']:
                score += 2
                reasons.append("Email domain does not match company website domain")
        else:
            reasons.append("Contact email not provided (email domain checks skipped)")

        # 4. Website diagnostics (if provided)
        if not features['has_website']:
            reasons.append("Company website not provided (online presence checks skipped)")

        # 5. Generic job title
        if features['is_generic_title']:
            score += 2
            reasons.append("Job title matches high-risk generic pattern (e.g. Data Entry, Work From Home)")

        # 6. Keyword NLP signals
        if features['suspicious_keyword_count'] >= 2:
            score += min(features['suspicious_keyword_count'], 3)
            reasons.append(f"Job description contains {features['suspicious_keyword_count']} high-risk keywords (urgent, deposit, cash, etc.)")

        # 7. Regional registry check (if CIN was not verified)
        if not cin_status:
            if is_registered is False:
                score += 1
                reasons.append("Company not found in official regional registry")
            elif is_registered is True:
                score = max(0, score - 2)
                reasons.append("Verified company in official regional registry")

        return min(score, 10), reasons

    def predict_record(self, company_name, title, description, email='', website='', cin=''):
        """Main hybrid verification engine combining ML ensemble with heuristics"""
        # Input validation: Only company_name, title, description are strictly required!
        if not all([company_name, title, description]):
            return {
                'prediction': 'FAKE',
                'probability': 0.0,
                'risk_level': 'High',
                'suspicious_score': 10,
                'verification_status': 'REJECTED',
                'scam_status': 'Missing required fields',
                'tamil_nadu_registered': False,
                'cin_verified': 'Not Provided',
                'registered_company_name': None,
                'reasons': ['Missing required company name, job title, or description']
            }

        try:
            # 1. Database cross-referencing
            scam_match = check_scam_database(company_name)
            is_registered = check_tamil_nadu_registry(company_name)
            cin_status, cin_registered_name = check_cin_registry(cin) if cin else (None, None)

            # 2. Extract features (handles optional email & website)
            features, combined_text = self.extract_features(company_name, title, description, email, website)
            heuristic_score, reasons = self.calculate_heuristic_score(
                features, scam_match, is_registered, cin_status, cin_registered_name, company_name
            )

            # 3. ML Model Inference (if models available)
            ml_fake_prob = None
            if self.tfidf_vectorizer and self.scaler and self.logistic_model and self.rf_model:
                try:
                    # Align with trained model features
                    model_feat = {
                        'suspicious_keyword_count': features['suspicious_keyword_count'],
                        'professional_keyword_count': features['professional_keyword_count'],
                        'description_length': features['description_length'],
                        'title_length': features['title_length'],
                        'company_name_length': features['company_name_length'],
                        'is_free_email': features['is_free_email'],
                        'has_website': features['has_website'],
                        'domain_mismatch': features['domain_mismatch'],
                        'is_generic_company': features['is_generic_company'],
                        'is_generic_title': features['is_generic_title']
                    }
                    feat_df = pd.DataFrame([model_feat])
                    text_vec = self.tfidf_vectorizer.transform([combined_text])
                    scaled_num = self.scaler.transform(feat_df)
                    X_input = hstack([scaled_num, text_vec])

                    lr_prob = float(self.logistic_model.predict_proba(X_input)[0][1])
                    rf_prob = float(self.rf_model.predict_proba(X_input)[0][1])
                    ml_fake_prob = (lr_prob * 0.4 + rf_prob * 0.6)
                except Exception as ml_err:
                    print(f"ML inference error: {ml_err}")
                    ml_fake_prob = None

            # 4. Hybrid probability calculation
            if ml_fake_prob is not None:
                heuristic_fake_prob = heuristic_score / 10.0
                combined_fake_prob = (0.55 * ml_fake_prob) + (0.45 * heuristic_fake_prob)
            else:
                combined_fake_prob = heuristic_score / 10.0

            # Override for verified CIN
            if cin_status is True and not scam_match:
                combined_fake_prob = min(combined_fake_prob, 0.20)

            # Override for direct scam database matches
            if scam_match:
                combined_fake_prob = max(combined_fake_prob, 0.95)

            # Legitimate confidence (0.0 to 1.0)
            confidence_legitimate = round(max(0.0, min(1.0, 1.0 - combined_fake_prob)), 4)

            # Final classification
            is_fake = combined_fake_prob >= 0.50

            if combined_fake_prob >= 0.65:
                risk_level = 'High'
            elif combined_fake_prob >= 0.35:
                risk_level = 'Medium'
            else:
                risk_level = 'Low'

            prediction = 'FAKE' if is_fake else 'REAL'
            verification_status = 'REJECTED' if is_fake else ('APPROVED' if risk_level == 'Low' else 'MANUAL_REVIEW')
            scam_status = f"FLAGGED: {scam_match['reason']}" if scam_match else "No match in known scam database"

            cin_display = True if cin_status is True else (
                'Unverified (Not in Regional Records)' if cin_status == 'UNVERIFIED_REGIONAL' else (
                    'Invalid Format' if cin_status is False else 'Not Provided'
                )
            )

            return {
                'prediction': prediction,
                'probability': confidence_legitimate,
                'risk_level': risk_level,
                'suspicious_score': heuristic_score,
                'verification_status': verification_status,
                'scam_status': scam_status,
                'tamil_nadu_registered': is_registered if is_registered is not None else 'Unknown',
                'cin_verified': cin_display,
                'registered_company_name': cin_registered_name,
                'reasons': reasons if reasons else ['All standard verification checks passed']
            }
        except Exception as e:
            print(f"Prediction exception: {e}")
            return {
                'prediction': 'REAL',
                'probability': 0.5,
                'risk_level': 'Medium',
                'suspicious_score': 5,
                'verification_status': 'MANUAL_REVIEW',
                'scam_status': f'Error during analysis: {str(e)}',
                'tamil_nadu_registered': 'Unknown',
                'cin_verified': 'Error',
                'registered_company_name': None,
                'reasons': ['System error during evaluation; marked for manual review']
            }

# Initialize Fraud Detector
detector = JobFraudDetector()

# ============================================================================
# PERSISTED IN-MEMORY COLLECTIONS
# ============================================================================
users_collection = load_json_safe(USERS_FILE, [])
predictions_collection = load_json_safe(PREDICTIONS_FILE, [])

# ============================================================================
# API ROUTES
# ============================================================================

# Frontend build directory
FRONTEND_BUILD_DIR = os.path.join(BASE_DIR, '..', 'frontend', 'build')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve React frontend or fallback to index.html / API status"""
    if path != "" and os.path.exists(os.path.join(FRONTEND_BUILD_DIR, path)):
        return send_from_directory(FRONTEND_BUILD_DIR, path)
    if os.path.exists(os.path.join(FRONTEND_BUILD_DIR, 'index.html')):
        return send_from_directory(FRONTEND_BUILD_DIR, 'index.html')
    return jsonify({
        "message": "SAFE HIRE API is running!",
        "version": "2.1.0",
        "features": ["ML Ensemble", "MCA Registry", "CIN Verification", "Optional Email/Web"],
        "status": "online"
    })

@app.route('/api/visitors', methods=['GET', 'POST'])
def visitors():
    """Get or increment visitor count thread-safely"""
    with visitors_lock:
        data = load_json_safe(VISITORS_FILE, {'count': 0})
        count = data.get('count', 0)
        if request.method == 'POST':
            count += 1
            data['count'] = count
            data['last_updated'] = str(datetime.now())
            atomic_save_json(VISITORS_FILE, data)
        return jsonify({"visitor_count": count})

@app.route('/predict', methods=['POST'])
def predict():
    """Predict if a company or job posting is legitimate or fraudulent (email & website optional)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON payload provided"}), 400

        # Required fields are strictly company_name, title, and description
        required_fields = ['company_name', 'title', 'description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400

        result = detector.predict_record(
            company_name=data.get('company_name', ''),
            title=data.get('title', ''),
            description=data.get('description', ''),
            email=data.get('email', ''),
            website=data.get('website', ''),
            cin=data.get('cin', '')
        )

        # Record prediction history
        with predictions_lock:
            record = {
                'id': len(predictions_collection) + 1,
                'company_name': data.get('company_name'),
                'title': data.get('title'),
                'email': data.get('email', ''),
                'website': data.get('website', ''),
                'cin': data.get('cin', ''),
                'prediction': result['prediction'],
                'probability': result['probability'],
                'risk_level': result['risk_level'],
                'suspicious_score': result['suspicious_score'],
                'verification_status': result['verification_status'],
                'scam_status': result['scam_status'],
                'cin_verified': result.get('cin_verified', 'Not Provided'),
                'timestamp': datetime.now().isoformat()
            }
            predictions_collection.append(record)
            atomic_save_json(PREDICTIONS_FILE, predictions_collection)

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/auth/register', methods=['POST'])
def register():
    """Register a new user account"""
    try:
        data = request.get_json()
        if not data or not all(k in data for k in ['name', 'email', 'password']):
            return jsonify({"error": "Name, email, and password are required"}), 400

        email = data['email'].strip().lower()
        if not email or '@' not in email:
            return jsonify({"error": "Valid email address is required"}), 400

        if len(data['password']) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400

        with users_lock:
            if any(u['email'].lower() == email for u in users_collection):
                return jsonify({"error": "Email is already registered"}), 400

            hashed_pw = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            role = 'admin' if email in ADMIN_EMAILS else 'user'

            new_user = {
                'name': data['name'].strip(),
                'email': email,
                'password': hashed_pw,
                'role': role,
                'created_at': datetime.now().isoformat()
            }
            users_collection.append(new_user)
            atomic_save_json(USERS_FILE, users_collection)

        return jsonify({"message": "Registration successful! Please sign in."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    """Authenticate a user and return a JWT access token"""
    try:
        data = request.get_json()
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({"error": "Email and password are required"}), 400

        email = data['email'].strip().lower()
        password = data['password']

        with users_lock:
            user = next((u for u in users_collection if u['email'].lower() == email), None)

        if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({"error": "Invalid email or password"}), 401

        user_role = resolve_role(user)
        access_token = create_access_token(identity=user['email'])

        return jsonify({
            "access_token": access_token,
            "user": {
                "name": user['name'],
                "email": user['email'],
                "role": user_role
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/auth/me', methods=['GET'])
@jwt_required()
def me():
    """Return profile details for current authenticated user"""
    try:
        email = get_jwt_identity().lower()
        with users_lock:
            user = next((u for u in users_collection if u['email'].lower() == email), None)

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
    """Get comprehensive admin analytics and recent predictions"""
    try:
        email = get_jwt_identity().lower()
        with users_lock:
            user = next((u for u in users_collection if u['email'].lower() == email), None)

        if resolve_role(user) != 'admin':
            return jsonify({"error": "Administrator access required"}), 403

        with predictions_lock:
            total = len(predictions_collection)
            fake_count = len([p for p in predictions_collection if p.get('prediction') == 'FAKE'])
            real_count = total - fake_count
            fake_percentage = round((fake_count / total * 100), 1) if total > 0 else 0

            risk_dist = {
                "high": len([p for p in predictions_collection if p.get('risk_level') == 'High']),
                "medium": len([p for p in predictions_collection if p.get('risk_level') == 'Medium']),
                "low": len([p for p in predictions_collection if p.get('risk_level') == 'Low'])
            }

            # Return latest 10 predictions formatted
            recent = list(reversed(predictions_collection[-10:]))

        return jsonify({
            "total_predictions": total,
            "real_predictions": real_count,
            "fake_predictions": fake_count,
            "fake_percentage": fake_percentage,
            "risk_distribution": risk_dist,
            "predictions_summary": {"REAL": real_count, "FAKE": fake_count},
            "recent_predictions": recent
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# APPLICATION ENTRYPOINT
# ============================================================================
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))
    host = os.environ.get('HOST', '0.0.0.0')
    print("=" * 60)
    print("SAFE HIRE: Fake Company & Job Detection API")
    print("=" * 60)
    print(f"Registered users in database: {len(users_collection)}")
    print(f"Logged verifications in database: {len(predictions_collection)}")
    print(f"Listening on http://{host}:{port}")
    print("=" * 60)
    app.run(debug=False, port=port, host=host)
