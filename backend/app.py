# ============================================================================
# SAFE HIRE - SECURE APPLICATION BACKEND
# Hardened Full-Stack AI & Company Legitimacy Verification API
# ============================================================================

import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['NUMEXPR_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'

import re
import json
import time
import secrets
import logging
import threading
import tempfile
from collections import defaultdict
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage

import io
import socket
import ipaddress
import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
import pypdf

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

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('SafeHireSecurity')

# ============================================================================
# BASE DIRECTORY & ENVIRONMENT CONFIGURATION
# ============================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_BUILD_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'frontend', 'build'))
MODELS_DIR = os.path.join(BASE_DIR, '..', 'ml_models')
DATASETS_DIR = os.path.join(BASE_DIR, '..', 'datasets')
USERS_FILE = os.path.join(BASE_DIR, 'users.json')
PREDICTIONS_FILE = os.path.join(BASE_DIR, 'predictions.json')
VISITORS_FILE = os.path.join(BASE_DIR, 'visitors.json')
SCAMS_FILE = os.path.join(BASE_DIR, 'scams.json')

load_dotenv(os.path.join(BASE_DIR, '.env'), override=True)

# Flask Application Initialization
app = Flask(
    __name__,
    static_folder=FRONTEND_BUILD_DIR,
    static_url_path=''
)

# Request size limit (10 MB max payload for document scanning)
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024

# ============================================================================
# SECRETS MANAGEMENT & CRYPTOGRAPHIC CONFIGURATION
# ============================================================================
# Enforce or generate cryptographically secure random secret key
configured_jwt_secret = os.getenv('JWT_SECRET_KEY', '').strip()
if not configured_jwt_secret or configured_jwt_secret.startswith('replace-') or configured_jwt_secret == 'secret':
    # Generate an ephemeral high-entropy 256-bit random key for security
    app.config['JWT_SECRET_KEY'] = secrets.token_hex(32)
    logger.warning("No secure JWT_SECRET_KEY found in environment. Generated dynamic 256-bit ephemeral secret.")
else:
    app.config['JWT_SECRET_KEY'] = configured_jwt_secret

app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
jwt = JWTManager(app)

# ============================================================================
# ACCESS CONTROL & ROLE DEFINITIONS
# ============================================================================
raw_admin_emails = os.getenv('ADMIN_EMAILS', '').strip()
ADMIN_EMAILS = {
    email.strip().lower()
    for email in raw_admin_emails.split(',')
    if email.strip() and '@' in email
} if raw_admin_emails else set()

def resolve_role(user):
    """Determine role based on verified email or record"""
    if not user:
        return 'user'
    user_email = user.get('email', '').lower().strip()
    if user_email and user_email in ADMIN_EMAILS:
        return 'admin'
    return user.get('role', 'user')

# ============================================================================
# CORS CONFIGURATION
# ============================================================================
allowed_origins_env = os.getenv('ALLOWED_ORIGINS', '').strip()
if allowed_origins_env and allowed_origins_env != '*':
    allowed_origins = [o.strip() for o in allowed_origins_env.split(',') if o.strip()]
    CORS(app, origins=allowed_origins, supports_credentials=True)
else:
    CORS(app, resources={r"/*": {"origins": "*"}})

# Threading locks for atomic data persistence
users_lock = threading.Lock()
predictions_lock = threading.Lock()
visitors_lock = threading.Lock()
scams_lock = threading.Lock()
otp_lock = threading.Lock()
otp_store = {}  # In-memory thread-safe OTP verification cache

# ============================================================================
# IN-MEMORY SLIDING-WINDOW RATE LIMITER
# ============================================================================
class RateLimiter:
    """Thread-safe sliding-window in-memory rate limiter"""
    def __init__(self):
        self.requests = defaultdict(list)
        self.lock = threading.Lock()

    def is_allowed(self, key: str, max_requests: int, window_seconds: int = 60) -> bool:
        now = time.time()
        with self.lock:
            # Purge entries older than window
            cutoff = now - window_seconds
            self.requests[key] = [t for t in self.requests[key] if t > cutoff]
            if len(self.requests[key]) >= max_requests:
                return False
            self.requests[key].append(now)
            return True

limiter = RateLimiter()

def get_client_ip() -> str:
    """Safely obtain client IP address handling reverse proxies"""
    forwarded = request.headers.get('X-Forwarded-For')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.remote_addr or '127.0.0.1'

def apply_rate_limit(max_requests: int, window_seconds: int = 60):
    """Check rate limit for current endpoint by client IP"""
    ip = get_client_ip()
    key = f"{request.endpoint}:{ip}"
    if not limiter.is_allowed(key, max_requests, window_seconds):
        return jsonify({
            "error": "Too many requests. Please wait a moment before trying again.",
            "retry_after_seconds": window_seconds
        }), 429
    return None

# ============================================================================
# SECURITY HTTP HEADERS & PREFLIGHT HOOKS
# ============================================================================
@app.before_request
def handle_preflight():
    """Handle CORS preflight OPTIONS requests before routing"""
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        return response

@app.after_request
def apply_security_headers(response):
    """Inject defense-in-depth HTTP security headers on all responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=(), payment=()'
    
    # Content Security Policy (allows self, React scripts, Google fonts, and inline styles for Tailwind)
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https: http:; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self';"
    )
    
    # HSTS if HTTPS
    if request.is_secure:
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

    return response

# ============================================================================
# CENTRALIZED ERROR HANDLERS
# ============================================================================
@app.errorhandler(400)
def bad_request(e):
    return jsonify({"error": "Bad request. Please check your input parameters."}), 400

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Resource not found."}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed for this endpoint."}), 405

@app.errorhandler(413)
def request_entity_too_large(e):
    return jsonify({"error": "Payload too large. Maximum allowed size is 2MB."}), 413

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({"error": "Rate limit exceeded. Please slow down."}), 429

@app.errorhandler(500)
def internal_server_error(e):
    logger.error(f"Internal server error: {e}")
    return jsonify({"error": "An internal server error occurred."}), 500

@jwt.unauthorized_loader
def unauthorized_callback(msg):
    return jsonify({"error": "Authentication token required."}), 401

@jwt.invalid_token_loader
def invalid_token_callback(msg):
    return jsonify({"error": "Invalid authentication token."}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"error": "Authentication token has expired. Please sign in again."}), 401

# ============================================================================
# INPUT VALIDATION HELPERS
# ============================================================================
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
CIN_REGEX = re.compile(r'^[LUu][0-9]{5}[A-Za-z]{2}[0-9]{4}[A-Za-z]{3}[0-9]{6}$')

def sanitize_text(val: str, max_len: int = 500) -> str:
    """Strip and constrain string inputs"""
    if not val or not isinstance(val, str):
        return ""
    return val.strip()[:max_len]

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password length and basic complexity"""
    if not password or not isinstance(password, str):
        return False, "Password is required."
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if len(password) > 128:
        return False, "Password cannot exceed 128 characters."
    
    # Check for trivial common passwords
    common_weak = {'password', '12345678', 'password123', 'admin123', 'qwerty123', 'safehire123'}
    if password.lower() in common_weak:
        return False, "Password is too common and easily guessable."
    
    return True, ""

# Download NLTK data safely
NLTK_READY = True
for resource in ['punkt', 'stopwords', 'wordnet']:
    try:
        nltk.data.find(f'tokenizers/{resource}' if resource == 'punkt' else f'corpora/{resource}')
    except LookupError:
        try:
            nltk.download(resource, quiet=True)
        except Exception as e:
            logger.warning(f"Could not download NLTK '{resource}' ({type(e).__name__}). Falling back.")
            NLTK_READY = False

# ============================================================================
# ATOMIC JSON STORAGE HELPERS
# ============================================================================
def atomic_save_json(filepath, data):
    """Thread-safe and atomic file persistence using a temp file with strict permissions"""
    try:
        dir_name = os.path.dirname(filepath)
        with tempfile.NamedTemporaryFile('w', dir=dir_name, delete=False, encoding='utf-8') as tf:
            json.dump(data, tf, indent=2, default=str)
            temp_name = tf.name
        
        # Set file permissions to owner read/write only where supported
        try:
            os.chmod(temp_name, 0o600)
        except Exception:
            pass

        os.replace(temp_name, filepath)
        return True
    except Exception as e:
        logger.error(f"Error saving {filepath}: {e}")
        return False

def load_json_safe(filepath, default_val):
    """Safely load JSON data from disk"""
    if not os.path.exists(filepath):
        return default_val
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f"Warning reading {filepath}: {e}")
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
                        'reason': sanitize_text(str(row.get('reason', 'Reported fake job offers')), 200),
                        'category': sanitize_text(str(row.get('category', 'Employment Scam')), 100),
                        'reported_date': sanitize_text(str(row.get('reported_date', 'Unknown')), 50)
                    }
            logger.info(f"Loaded {len(SCAM_COMPANIES_DB)} known scam companies from database.")
    except Exception as e:
        logger.warning(f"Could not load scam database ({e})")

def check_scam_database(company_name):
    """Check if company name matches known fraudulent company listings"""
    if not company_name or not SCAM_COMPANIES_DB:
        return None

    clean_input = company_name.lower().strip()
    if clean_input in SCAM_COMPANIES_DB:
        return SCAM_COMPANIES_DB[clean_input]

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
        # 1. Load sample MCA dataset
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

        # 2. Load Tamil Nadu registry
        tn_csv_path = os.path.join(DATASETS_DIR, 'tamil_nadu_companies.csv')
        if os.path.exists(tn_csv_path):
            logger.info(f"Loading company registry from {os.path.basename(tn_csv_path)}...")
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

            logger.info(f"Loaded {len(TN_COMPANY_NAMES)} registered companies ({len(TN_CIN_MAP)} with CIN).")
            return True
        else:
            logger.warning("Company registry file not found.")
            return False
    except Exception as e:
        logger.warning(f"Could not load company registry ({e}). Registry checks disabled.")
        return False

def check_cin_registry(cin):
    """Check if CIN exists in official database"""
    if not cin:
        return None, None
    clean_cin = str(cin).strip().upper()
    if clean_cin in TN_CIN_MAP:
        return True, TN_CIN_MAP[clean_cin]
    
    if CIN_REGEX.match(clean_cin):
        return 'UNVERIFIED_REGIONAL', None
    
    return False, None

def check_tamil_nadu_registry(company_name):
    """Check if company is verified in official registry (with false-positive protection)"""
    if not TN_COMPANY_NAMES or not company_name:
        return None

    normalized_name = company_name.lower().strip()
    if normalized_name in TN_COMPANY_NAMES:
        return True

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
        """Load trained ML models safely from ml_models directory"""
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
                logger.info("ML models (TF-IDF, Scaler, Logistic Regression, Random Forest) loaded successfully.")
            else:
                logger.info("ML model files not yet trained. Using heuristic mode.")
        except Exception as e:
            logger.warning(f"Could not load ML models ({type(e).__name__}: {e}). Using heuristic mode.")

    def preprocess_text(self, text):
        """Clean and normalize textual content safely with bounded length"""
        if not text or not isinstance(text, str):
            return ""
        text = text[:5000].lower()
        text = re.sub(r'[^a-zA-Z\s]', ' ', text)
        words = text.split()
        if self.stop_words:
            words = [self.lemmatizer.lemmatize(w) for w in words if w not in self.stop_words]
        else:
            words = [self.lemmatizer.lemmatize(w) for w in words]
        return ' '.join(words)

    def extract_features(self, company_name, title, description, email='', website=''):
        """Extract structured features for heuristic and ML scoring (bounded and sanitized)"""
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

        # Free email provider check
        free_domains = {'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediff.com', 'aol.com', 'mail.com'}
        email_str = str(email or '').strip().lower()
        if email_str and '@' in email_str:
            domain = email_str.split('@')[-1]
            features['is_free_email'] = 1 if domain in free_domains else 0
            features['email_provided'] = 1
        else:
            features['is_free_email'] = 0
            features['email_provided'] = 0

        # Website check
        web_str = str(website or '').strip().lower()
        has_web = 1 if web_str and web_str not in {'none', 'null', 'n/a', ''} else 0
        features['has_website'] = has_web

        # Domain mismatch check
        if features['email_provided'] and has_web:
            email_domain = email_str.split('@')[-1].strip()
            clean_web = web_str.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0].strip()
            features['domain_mismatch'] = 0 if (email_domain in clean_web or clean_web in email_domain) else 1
        else:
            features['domain_mismatch'] = 0

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

        # 2. CIN verification
        if cin_status is True:
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

        # 3. Email diagnostics
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

        # 4. Website diagnostics
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

        # 7. Regional registry check
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
            scam_match = check_scam_database(company_name)
            is_registered = check_tamil_nadu_registry(company_name)
            cin_status, cin_registered_name = check_cin_registry(cin) if cin else (None, None)

            features, combined_text = self.extract_features(company_name, title, description, email, website)
            heuristic_score, reasons = self.calculate_heuristic_score(
                features, scam_match, is_registered, cin_status, cin_registered_name, company_name
            )

            ml_fake_prob = None
            if self.tfidf_vectorizer and self.scaler and self.logistic_model and self.rf_model:
                try:
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
                    logger.warning(f"ML inference warning: {ml_err}")
                    ml_fake_prob = None

            if ml_fake_prob is not None:
                heuristic_fake_prob = heuristic_score / 10.0
                combined_fake_prob = (0.55 * ml_fake_prob) + (0.45 * heuristic_fake_prob)
            else:
                combined_fake_prob = heuristic_score / 10.0

            if cin_status is True and not scam_match:
                combined_fake_prob = min(combined_fake_prob, 0.20)

            if scam_match:
                combined_fake_prob = max(combined_fake_prob, 0.95)

            confidence_legitimate = round(max(0.0, min(1.0, 1.0 - combined_fake_prob)), 4)
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
            logger.error(f"Prediction exception: {e}")
            return {
                'prediction': 'REAL',
                'probability': 0.5,
                'risk_level': 'Medium',
                'suspicious_score': 5,
                'verification_status': 'MANUAL_REVIEW',
                'scam_status': 'Diagnostic service flagged item for review',
                'tamil_nadu_registered': 'Unknown',
                'cin_verified': 'Error',
                'registered_company_name': None,
                'reasons': ['Automated evaluation paused; marked for manual review']
            }

# Initialize Fraud Detector
detector = JobFraudDetector()

# ============================================================================
# PERSISTED IN-MEMORY COLLECTIONS
# ============================================================================
users_collection = load_json_safe(USERS_FILE, [])
predictions_collection = load_json_safe(PREDICTIONS_FILE, [])
scams_collection = load_json_safe(SCAMS_FILE, [])

# ============================================================================
# API ROUTES
# ============================================================================

@app.route('/api/visitors', methods=['GET', 'POST'])
@app.route('/visitors', methods=['GET', 'POST'])
def visitors():
    """Get or increment visitor count with rate limiting and thread safety"""
    rate_err = apply_rate_limit(max_requests=20, window_seconds=60)
    if rate_err:
        return rate_err

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
@app.route('/api/predict', methods=['POST'])
def predict():
    """Analyze company or job posting legitimacy with rate limiting & server validation"""
    rate_err = apply_rate_limit(max_requests=30, window_seconds=60)
    if rate_err:
        return rate_err

    try:
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Valid JSON payload required."}), 400

        # Validate and sanitize input fields
        company_name = sanitize_text(data.get('company_name', ''), max_len=200)
        title = sanitize_text(data.get('title', ''), max_len=200)
        description = sanitize_text(data.get('description', ''), max_len=5000)
        email = sanitize_text(data.get('email', ''), max_len=150)
        website = sanitize_text(data.get('website', ''), max_len=300)
        cin = sanitize_text(data.get('cin', ''), max_len=30).upper()

        if not company_name:
            return jsonify({"error": "Company Name is required (max 200 characters)."}), 400
        if not title:
            return jsonify({"error": "Job Title is required (max 200 characters)."}), 400
        if not description or len(description) < 5:
            return jsonify({"error": "Job Description must be at least 5 characters (max 5000)."}), 400

        if email and not EMAIL_REGEX.match(email):
            return jsonify({"error": "Provided contact email format is invalid."}), 400

        result = detector.predict_record(
            company_name=company_name,
            title=title,
            description=description,
            email=email,
            website=website,
            cin=cin
        )

        # Record prediction history
        with predictions_lock:
            record = {
                'id': len(predictions_collection) + 1,
                'company_name': company_name,
                'title': title,
                'email': email,
                'website': website,
                'cin': cin,
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
        logger.error(f"Error in /predict: {e}")
        return jsonify({"error": "An error occurred while processing the verification request."}), 500

@app.route('/auth/register', methods=['POST'])
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user account with rate limiting & password validation"""
    rate_err = apply_rate_limit(max_requests=5, window_seconds=60)
    if rate_err:
        return rate_err

    try:
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Valid JSON payload required."}), 400

        name = sanitize_text(data.get('name', ''), max_len=100)
        email = sanitize_text(data.get('email', ''), max_len=150).lower()
        phone = sanitize_text(data.get('phone', ''), max_len=30)
        password = str(data.get('password', ''))

        if not name or len(name) < 2:
            return jsonify({"error": "Full Name must be at least 2 characters."}), 400

        if not email or not EMAIL_REGEX.match(email):
            return jsonify({"error": "A valid email address is required."}), 400

        valid_pw, pw_err = validate_password_strength(password)
        if not valid_pw:
            return jsonify({"error": pw_err}), 400

        with users_lock:
            if any(u.get('email', '').lower() == email for u in users_collection):
                return jsonify({"error": "An account with this email already exists."}), 400

            hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            role = 'admin' if email in ADMIN_EMAILS else 'user'

            new_user = {
                'name': name,
                'email': email,
                'phone': phone,
                'password': hashed_pw,
                'role': role,
                'created_at': datetime.now().isoformat()
            }
            users_collection.append(new_user)
            atomic_save_json(USERS_FILE, users_collection)

        return jsonify({"message": "Registration successful! Please sign in."})
    except Exception as e:
        logger.error(f"Error in /auth/register: {e}")
        return jsonify({"error": "An error occurred during account registration."}), 500

@app.route('/auth/login', methods=['POST'])
@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate a user and return a JWT access token with brute force rate limiting"""
    rate_err = apply_rate_limit(max_requests=5, window_seconds=60)
    if rate_err:
        return rate_err

    try:
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Email and password are required."}), 400

        email = sanitize_text(data.get('email', ''), max_len=150).lower()
        password = str(data.get('password', ''))

        if not email or not password:
            return jsonify({"error": "Email and password are required."}), 400

        with users_lock:
            user = next((u for u in users_collection if u.get('email', '').lower() == email), None)

        if not user or not bcrypt.checkpw(password.encode('utf-8'), user.get('password', '').encode('utf-8')):
            return jsonify({"error": "Invalid email or password."}), 401

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
        logger.error(f"Error in /auth/login: {e}")
        return jsonify({"error": "An error occurred during sign in."}), 500

def normalize_phone(phone: str) -> str:
    """Normalize phone number to digits or clean international format"""
    if not phone:
        return ''
    cleaned = re.sub(r'[\s\-\(\)]', '', phone.strip())
    return cleaned

SMTP_SERVER = os.getenv('SMTP_SERVER', '').strip()
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', '').strip()
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '').strip()
SMTP_FROM_EMAIL = os.getenv('SMTP_FROM_EMAIL', SMTP_USERNAME or 'noreply@safehire.ai').strip()

def send_email_otp(to_email: str, otp_code: str) -> bool:
    """Send HTML verification OTP to user's real email inbox via SMTP if configured"""
    smtp_server = os.getenv('SMTP_SERVER', '').strip() or 'smtp.gmail.com'
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    smtp_user = os.getenv('SMTP_USERNAME', '').strip()
    smtp_pass = os.getenv('SMTP_PASSWORD', '').replace(' ', '').strip()
    smtp_from = os.getenv('SMTP_FROM_EMAIL', smtp_user or 'noreply@safehire.ai').strip()

    if not smtp_server or not smtp_user or not smtp_pass:
        logger.info(f"[DEV SERVER LOG] OTP for {to_email} -> {otp_code} (Configure SMTP in .env for real email delivery)")
        return False
    try:
        msg_root = MIMEMultipart('related')
        msg_root['Subject'] = "🔐 SAFE HIRE - Password Reset Verification Code"
        msg_root['From'] = f"SAFE HIRE <{smtp_from}>"
        msg_root['To'] = to_email

        msg_alternative = MIMEMultipart('alternative')
        msg_root.attach(msg_alternative)

        shield_img_path = os.path.join(BASE_DIR, '..', 'frontend', 'src', 'assets', 'safe-hire-shield.png')
        has_logo = os.path.exists(shield_img_path)

        logo_html = '<img src="cid:safehire_logo" alt="SAFE HIRE Logo" style="width: 56px; height: 56px; margin: 0 auto 12px auto; display: block; object-fit: contain;" />' if has_logo else ''

        html_content = f"""
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; padding: 30px 15px; margin: 0;">
          <div style="max-width: 480px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 18px; padding: 32px 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); text-align: center;">
            <div style="margin-bottom: 24px;">
              {logo_html}
              <h2 style="color: #38bdf8; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">SAFE HIRE</h2>
              <p style="color: #64748b; font-size: 12px; margin-top: 5px; font-weight: 500;">AI Company & Recruitment Fraud Defense</p>
            </div>
            
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h3 style="color: #f1f5f9; font-size: 15px; margin: 0 0 10px 0; font-weight: 600;">Password Reset Verification</h3>
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0 0 20px 0;">
                You requested to reset your account password. Enter this verification code to proceed:
              </p>
              
              <div style="display: inline-block; background: linear-gradient(135deg, #0284c7, #06b6d4); padding: 14px 28px; border-radius: 12px; letter-spacing: 8px; font-size: 30px; font-weight: 900; color: #ffffff; font-family: 'Courier New', monospace; box-shadow: 0 4px 15px rgba(6, 182, 212, 0.35);">
                {otp_code}
              </div>
              
              <p style="color: #38bdf8; font-size: 12px; margin: 16px 0 0 0; font-weight: 600;">
                ⏱️ Valid for 2 minutes only
              </p>
            </div>
            
            <p style="color: #64748b; font-size: 11px; margin: 0; line-height: 1.4; border-top: 1px solid #1e293b; padding-top: 16px;">
              If you did not request this password reset, please ignore this email.<br />
              &copy; 2026 SAFE HIRE Security System. All rights reserved.
            </p>
          </div>
        </body>
        </html>
        """
        plain_text = f"SAFE HIRE Verification Code: {otp_code}\n\nYour 6-digit password reset verification code is: {otp_code}\n\nThis code is valid for 2 minutes. Please do not share this code with anyone.\n\nSAFE HIRE - AI Company & Recruitment Fraud Defense"
        msg_alternative.attach(MIMEText(plain_text, 'plain'))
        msg_alternative.attach(MIMEText(html_content, 'html'))

        if has_logo:
            try:
                with open(shield_img_path, 'rb') as f:
                    img = MIMEImage(f.read())
                    img.add_header('Content-ID', '<safehire_logo>')
                    img.add_header('Content-Disposition', 'inline', filename='safe-hire-shield.png')
                    msg_root.attach(img)
            except Exception as img_err:
                logger.warning(f"Could not attach inline logo image: {img_err}")

        if smtp_port == 465 or '465' in str(smtp_port):
            server = smtplib.SMTP_SSL(smtp_server, 465, timeout=10)
        else:
            server = smtplib.SMTP(smtp_server, smtp_port, timeout=10)
            server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_from, [to_email], msg_root.as_string())
        server.quit()
        logger.info(f"Successfully sent real verification email with logo to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to dispatch email to {to_email} via SMTP: {e}")
        return False

@app.route('/auth/send-otp', methods=['POST'])
@app.route('/api/auth/send-otp', methods=['POST'])
def send_otp():
    """Generate and dispatch a cryptographically secure 6-digit OTP for Email or Phone"""
    rate_err = apply_rate_limit(max_requests=5, window_seconds=60)
    if rate_err:
        return rate_err

    try:
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Valid JSON payload required."}), 400

        method = sanitize_text(data.get('method', 'email'), max_len=10).lower()
        identifier = sanitize_text(data.get('identifier', '') or data.get('email', '') or data.get('phone', ''), max_len=150).strip()

        if not identifier:
            return jsonify({"error": "Please provide your registered Email Address or Phone Number."}), 400

        clean_id = identifier.lower() if '@' in identifier else normalize_phone(identifier)
        user = None

        with users_lock:
            for u in users_collection:
                u_email = (u.get('email') or '').strip().lower()
                u_phone = normalize_phone(u.get('phone') or '')
                if '@' in identifier and u_email == clean_id:
                    user = u
                    break
                elif normalize_phone(identifier) and (u_phone == clean_id or (u_phone and clean_id and (u_phone.endswith(clean_id) or clean_id.endswith(u_phone)))):
                    user = u
                    break
                # Fallback: if user typed email in phone mode or vice-versa
                elif u_email == clean_id or (u_phone and u_phone == clean_id):
                    user = u
                    break

        if not user:
            target_type = "Phone Number" if ('@' not in identifier and any(c.isdigit() for c in identifier)) else "Email Address"
            return jsonify({"error": f"No registered account found with this {target_type}."}), 404

        # Generate 6-digit numeric OTP with cryptographic entropy (2 minutes validity)
        otp_val = str(secrets.randbelow(900000) + 100000)
        expires_at = time.time() + 120  # 2 minutes validity

        lookup_key = user.get('email', '').strip().lower()

        with otp_lock:
            otp_store[lookup_key] = {
                'otp': otp_val,
                'expires_at': expires_at,
                'attempts': 0,
                'user_email': lookup_key
            }
            # Also key by phone if available
            if user.get('phone'):
                otp_store[normalize_phone(user['phone'])] = otp_store[lookup_key]

        # Dispatch via Email asynchronously in background thread for fast UI response
        if '@' in lookup_key:
            threading.Thread(target=send_email_otp, args=(lookup_key, otp_val), daemon=True).start()

        masked_target = lookup_key
        if method == 'phone' or ('@' not in identifier and any(c.isdigit() for c in identifier)):
            raw_phone = user.get('phone') or identifier
            masked_target = f"******{raw_phone[-4:]}" if len(raw_phone) >= 4 else raw_phone
            msg = f"A 6-digit OTP code has been dispatched to your registered Mobile Number ({masked_target})."
        else:
            parts = lookup_key.split('@')
            masked_target = f"{parts[0][:2]}***@{parts[1]}" if len(parts) == 2 and len(parts[0]) >= 2 else lookup_key
            msg = f"A 6-digit OTP code has been dispatched to your registered Email ({masked_target})."

        logger.info(f"🔐 [SECURITY OTP CODE] Dispatched for {lookup_key} ({method}): {otp_val} (Valid for 2 minutes)")

        return jsonify({
            "message": msg,
            "target": masked_target,
            "method": method,
            "identifier": lookup_key,
            "expires_in_seconds": 120
        })
    except Exception as e:
        logger.error(f"Error in /auth/send-otp: {e}")
        return jsonify({"error": "Failed to generate security OTP."}), 500

@app.route('/auth/verify-otp-reset', methods=['POST'])
@app.route('/auth/reset-password', methods=['POST'])
@app.route('/api/auth/verify-otp-reset', methods=['POST'])
@app.route('/api/auth/reset-password', methods=['POST'])
def verify_otp_reset():
    """Verify 6-digit OTP and reset user password"""
    rate_err = apply_rate_limit(max_requests=5, window_seconds=60)
    if rate_err:
        return rate_err

    try:
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Valid JSON payload required."}), 400

        identifier = sanitize_text(data.get('identifier', '') or data.get('email', '') or data.get('phone', ''), max_len=150).strip()
        otp = sanitize_text(data.get('otp', ''), max_len=10).strip()
        new_password = str(data.get('new_password', ''))

        if not identifier:
            return jsonify({"error": "Registered email or phone is required."}), 400

        if not otp or len(otp) != 6 or not otp.isdigit():
            return jsonify({"error": "Please enter a valid 6-digit verification code."}), 400

        valid_pw, pw_err = validate_password_strength(new_password)
        if not valid_pw:
            return jsonify({"error": pw_err}), 400

        clean_id = identifier.lower() if '@' in identifier else normalize_phone(identifier)
        user_email = None

        with otp_lock:
            record = otp_store.get(clean_id)
            if not record:
                # Check by looking through active records
                record = next((r for k, r in otp_store.items() if k == clean_id or r.get('user_email') == clean_id), None)

            if not record:
                return jsonify({"error": "No active OTP request found. Please request a new code."}), 400

            if time.time() > record['expires_at']:
                otp_store.pop(clean_id, None)
                return jsonify({"error": "Verification code has expired (2-minute limit exceeded). Please request a new code."}), 400

            if record['attempts'] >= 5:
                otp_store.pop(clean_id, None)
                return jsonify({"error": "Maximum verification attempts exceeded. Please request a new code."}), 429

            if not secrets.compare_digest(record['otp'], otp):
                record['attempts'] += 1
                remaining = 5 - record['attempts']
                return jsonify({"error": f"Invalid verification code. ({remaining} attempts remaining)"}), 400

            user_email = record.get('user_email') or clean_id
            # Verified successfully! Remove OTP to prevent replay attacks
            otp_store.pop(clean_id, None)
            if user_email in otp_store:
                otp_store.pop(user_email, None)

        with users_lock:
            user = next((u for u in users_collection if u.get('email', '').lower() == user_email.lower()), None)
            if not user:
                return jsonify({"error": "User account not found."}), 404

            hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user['password'] = hashed_pw
            user['updated_at'] = datetime.now().isoformat()
            atomic_save_json(USERS_FILE, users_collection)

        return jsonify({"message": "Verification successful! Password updated. Please sign in."})
    except Exception as e:
        logger.error(f"Error in /auth/verify-otp-reset: {e}")
        return jsonify({"error": "An error occurred while resetting the password."}), 500

@app.route('/auth/me', methods=['GET'])
@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def me():
    """Return profile details for current authenticated user"""
    try:
        email = get_jwt_identity().lower()
        with users_lock:
            user = next((u for u in users_collection if u.get('email', '').lower() == email), None)

        if not user:
            return jsonify({"error": "User account not found."}), 404

        return jsonify({
            "name": user['name'],
            "email": user['email'],
            "role": resolve_role(user)
        })
    except Exception as e:
        logger.error(f"Error in /auth/me: {e}")
        return jsonify({"error": "An error occurred retrieving user profile."}), 500

@app.route('/admin/analytics', methods=['GET'])
@app.route('/api/admin/analytics', methods=['GET'])
@jwt_required()
def analytics():
    """Get comprehensive admin analytics (Restricted to Administrator role)"""
    try:
        email = get_jwt_identity().lower()
        with users_lock:
            user = next((u for u in users_collection if u.get('email', '').lower() == email), None)

        if not user or resolve_role(user) != 'admin':
            return jsonify({"error": "Administrator privileges required to access analytics."}), 403

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
        logger.error(f"Error in /admin/analytics: {e}")
        return jsonify({"error": "An error occurred retrieving analytics."}), 500

# ============================================================================
# SSRF PROTECTION & URL FETCHING
# ============================================================================
BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network('127.0.0.0/8'),
    ipaddress.ip_network('10.0.0.0/8'),
    ipaddress.ip_network('172.16.0.0/12'),
    ipaddress.ip_network('192.168.0.0/16'),
    ipaddress.ip_network('169.254.0.0/16'),
    ipaddress.ip_network('0.0.0.0/8'),
    ipaddress.ip_network('100.64.0.0/10'),
    ipaddress.ip_network('198.18.0.0/15'),
    ipaddress.ip_network('::1/128'),
    ipaddress.ip_network('fc00::/7'),
    ipaddress.ip_network('fe80::/10'),
]

def is_safe_external_url(url_str: str) -> tuple:
    """Validate URL against SSRF attacks (blocks private networks, localhost, cloud metadata)"""
    try:
        parsed = urllib.parse.urlparse(url_str.strip())
        if parsed.scheme not in ('http', 'https'):
            return False, "Only standard HTTP and HTTPS URLs are supported."

        hostname = parsed.hostname
        if not hostname:
            return False, "Invalid URL hostname."

        # Block localhost, cloud metadata, and container hostnames
        if hostname.lower() in {'localhost', 'metadata.google.internal', 'instance-data', '169.254.169.254'}:
            return False, "Access to private/internal domain is forbidden."

        # Resolve hostname to IPv4/IPv6
        addr_info = socket.getaddrinfo(hostname, None)
        if not addr_info:
            return False, "Could not resolve hostname."

        for item in addr_info:
            ip_str = item[4][0]
            ip_obj = ipaddress.ip_address(ip_str)
            if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_reserved or ip_obj.is_link_local:
                return False, f"Access to private/internal IP address ({ip_str}) is restricted."
            for net in BLOCKED_IP_NETWORKS:
                if ip_obj in net:
                    return False, f"Access to restricted IP range ({ip_str}) is blocked."

        return True, ""
    except Exception as e:
        return False, f"URL validation failed: {str(e)}"

# ============================================================================
# OFFER LETTER FRAUD DETECTION HEURISTICS
# ============================================================================
FEE_KEYWORDS_REGEX = re.compile(
    r'\b(?:'
    r'registration\s+fee|training\s+fee|security\s+deposit|laptop\s+deposit|caution\s+deposit|'
    r'courier\s+charges?|stamp\s+paper|refundable\s+(?:fee|deposit|amount)|processing\s+fee|'
    r'documentation\s+fee|medical\s+(?:checkup|test)\s+fee|id\s+card\s+fee|uniform\s+fee|'
    r'bank\s+verification\s+fee|joining\s+kit\s+charge|pay\s+(?:rs\.?|inr|₹|\$)\s*\d+|'
    r'deposit\s+(?:rs\.?|inr|₹|\$)\s*\d+|send\s+money|transfer\s+to\s+upi|gpay|phonepe|paytm'
    r')\b',
    re.IGNORECASE
)

FREE_EMAIL_DOMAINS = {'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediffmail.com', 'aol.com', 'mail.com', 'yopmail.com', 'protonmail.com'}
TOP_MNCS = {'tcs', 'tata consultancy services', 'infosys', 'wipro', 'hcl', 'cognizant', 'accenture', 'google', 'microsoft', 'amazon', 'ibm', 'capgemini', 'tech mahindra', 'zoho', 'oracle', 'deloitte', 'l&t', 'larsentoubro'}

def analyze_offer_letter_text(raw_text: str) -> dict:
    """Deep forensic inspection of offer letter document text"""
    clean_text = raw_text[:30000]
    text_lower = clean_text.lower()

    red_flags = []
    green_flags = []
    risk_score = 0

    # 1. Look for fee demands
    fee_matches = list(set(FEE_KEYWORDS_REGEX.findall(text_lower)))
    if fee_matches:
        risk_score += 45
        red_flags.append(f"Financial demand detected: References upfront payment/deposit keywords ({', '.join(fee_matches[:4])})")
    else:
        green_flags.append("No upfront registration, security deposit, or processing fee demands found.")

    # 2. Extract emails & check domains
    found_emails = list(set(re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', clean_text)))
    free_mail_detected = False
    for em in found_emails:
        domain = em.split('@')[-1].lower()
        if domain in FREE_EMAIL_DOMAINS:
            free_mail_detected = True
            break

    # Check if text mentions a top MNC
    mnc_mentioned = [mnc for mnc in TOP_MNCS if mnc in text_lower]
    if free_mail_detected:
        if mnc_mentioned:
            risk_score += 40
            red_flags.append(f"Impersonation Alert: Mentions '{mnc_mentioned[0].upper()}' but uses public webmail ({found_emails[0]}) instead of verified enterprise domain.")
        else:
            risk_score += 20
            red_flags.append(f"Contact email uses free public webmail ({found_emails[0]}) rather than corporate domain.")
    elif found_emails:
        green_flags.append(f"Uses corporate email domain ({found_emails[0]}).")

    # 3. Urgency and threats
    urgent_keywords = ['within 24 hours', 'immediate payment', 'legal action', 'court notice', 'police complaint', 'forfeit offer', 'non-refundable']
    urgent_found = [uk for uk in urgent_keywords if uk in text_lower]
    if urgent_found:
        risk_score += 20
        red_flags.append(f"High-pressure / coercive language detected: '{', '.join(urgent_found)}'")

    # 4. CIN Check
    cin_matches = re.findall(r'[LUu][0-9]{5}[A-Za-z]{2}[0-9]{4}[A-Za-z]{3}[0-9]{6}', clean_text)
    detected_cin = cin_matches[0].upper() if cin_matches else None
    if detected_cin:
        cin_status, cin_name = check_cin_registry(detected_cin)
        if cin_status is True:
            risk_score = max(0, risk_score - 25)
            green_flags.append(f"Valid Government MCA Corporate CIN ({detected_cin}) registered to '{cin_name}'")
        elif cin_status == 'UNVERIFIED_REGIONAL':
            green_flags.append(f"Valid 21-character MCA CIN format ({detected_cin}) detected")
        else:
            red_flags.append(f"CIN ({detected_cin}) failed official MCA verification")
    else:
        red_flags.append("No Government Corporate Identification Number (CIN) found in document")

    # 5. Extract Company Name & Job Title heuristic
    lines = [l.strip() for l in clean_text.split('\n') if l.strip()]
    extracted_company = ""
    extracted_title = ""
    for line in lines[:10]:
        if len(line) < 60 and any(w in line.lower() for w in ['ltd', 'private', 'pvt', 'inc', 'technologies', 'solutions', 'corporation', 'services', 'systems', 'consultancy', 'enterprises']):
            extracted_company = line
            break
    if not extracted_company and lines:
        extracted_company = lines[0][:50]

    for line in lines[:15]:
        if any(w in line.lower() for w in ['offer', 'position', 'role', 'designation', 'appointment', 'developer', 'engineer', 'analyst', 'manager', 'executive', 'assistant', 'intern']):
            extracted_title = line[:60]
            break

    # 6. Extract salary if any
    salary_match = re.findall(r'(?:ctc|salary|stipend|package|inr|rs\.?|₹)\s*[:\-]?\s*([0-9,]+(?:\s*(?:lpa|per\s+month|pm|per\s+annum|lac|lakh))?)', clean_text, re.IGNORECASE)
    extracted_salary = salary_match[0] if salary_match else "Not explicitly specified"

    # ML Classifier run
    ml_result = detector.predict_record(
        company_name=extracted_company or "Offer Letter Issuer",
        title=extracted_title or "Job Candidate",
        description=clean_text[:4000],
        email=found_emails[0] if found_emails else '',
        cin=detected_cin or ''
    )

    if ml_result['prediction'] == 'FAKE':
        risk_score = max(risk_score, int(ml_result['suspicious_score'] * 9))

    final_risk_score = min(100, max(0, risk_score))
    legitimacy_score = 100 - final_risk_score

    if final_risk_score >= 60:
        verdict = "HIGH_RISK_FRAUD"
        status_label = "SUSPECTED FAKE OFFER"
    elif final_risk_score >= 30:
        verdict = "SUSPICIOUS"
        status_label = "PROCEED WITH CAUTION"
    else:
        verdict = "GENUINE"
        status_label = "LIKELY LEGITIMATE"

    recommendations = []
    if final_risk_score >= 50:
        recommendations.append("❌ DO NOT transfer any money or provide UPI payments for training, laptop, or document verification.")
        recommendations.append("📞 Contact the company directly through their official website contact page (not numbers on the letter).")
        recommendations.append("🛡️ File a complaint on Cyber Crime Portal (cybercrime.gov.in) if payment was demanded.")
    else:
        recommendations.append("✅ Verify salary structure, probation period, and official joining location.")
        recommendations.append("✅ Confirm with HR from an official company email address.")

    return {
        "verdict": verdict,
        "status_label": status_label,
        "legitimacy_score": legitimacy_score,
        "risk_score": final_risk_score,
        "extracted_details": {
            "company_name": extracted_company or "Unknown Entity",
            "job_title": extracted_title or "Position Not Specified",
            "emails": found_emails,
            "cin": detected_cin or "Not Found",
            "salary": extracted_salary,
            "char_count": len(clean_text)
        },
        "red_flags": red_flags,
        "green_flags": green_flags,
        "recommendations": recommendations,
        "raw_text_preview": clean_text[:500] + ("..." if len(clean_text) > 500 else "")
    }

# ============================================================================
# NEW FEATURE ROUTES: OFFER SCANNER, URL FETCHER, SCAM ALERT BOARD
# ============================================================================

@app.route('/api/scan-offer-letter', methods=['POST'])
def scan_offer_letter():
    """Scan uploaded offer letter PDF document or pasted text for fraud patterns"""
    rate_err = apply_rate_limit(max_requests=15, window_seconds=60)
    if rate_err:
        return rate_err

    try:
        extracted_text = ""
        filename = "pasted_text"

        # Check if file was uploaded in multipart/form-data
        if 'file' in request.files:
            file_obj = request.files['file']
            filename = sanitize_text(file_obj.filename or 'document.pdf', max_len=100)
            file_bytes = file_obj.read()
            if len(file_bytes) == 0:
                return jsonify({"error": "Uploaded file is empty."}), 400

            if filename.lower().endswith('.pdf') or file_bytes[:4] == b'%PDF':
                try:
                    pdf_reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                    pages_text = []
                    for page in pdf_reader.pages[:10]: # Max 10 pages
                        txt = page.extract_text() or ""
                        pages_text.append(txt)
                    extracted_text = "\n".join(pages_text).strip()
                except Exception as pdf_err:
                    logger.warning(f"pypdf extraction error: {pdf_err}")
                    return jsonify({"error": "Failed to extract text from PDF document. Please ensure file is not password protected."}), 400
            else:
                # Text or markdown file
                try:
                    extracted_text = file_bytes.decode('utf-8', errors='ignore').strip()
                except Exception:
                    extracted_text = ""
        else:
            # Check JSON body or form data
            data = request.get_json(silent=True) or request.form
            extracted_text = sanitize_text(data.get('text', ''), max_len=30000).strip()

        if not extracted_text or len(extracted_text) < 15:
            return jsonify({"error": "Could not find sufficient readable text in the offer letter. Please paste the offer letter text directly."}), 400

        analysis = analyze_offer_letter_text(extracted_text)
        analysis['filename'] = filename
        analysis['scanned_at'] = datetime.now().isoformat()

        return jsonify(analysis)
    except Exception as e:
        logger.error(f"Error in /api/scan-offer-letter: {e}")
        return jsonify({"error": "An error occurred during document forensic scanning."}), 500

@app.route('/api/fetch-job-url', methods=['POST'])
def fetch_job_url():
    """Auto-extract Job Title, Company Name, and Description from LinkedIn/Naukri/Indeed/Career URL"""
    rate_err = apply_rate_limit(max_requests=10, window_seconds=60)
    if rate_err:
        return rate_err

    try:
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Valid JSON payload required."}), 400

        target_url = sanitize_text(data.get('url', ''), max_len=1000).strip()
        if not target_url:
            return jsonify({"error": "Job posting URL is required."}), 400

        is_safe, err_msg = is_safe_external_url(target_url)
        if not is_safe:
            return jsonify({"error": f"Security restriction: {err_msg}"}), 400

        req = urllib.request.Request(
            target_url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            html_bytes = response.read(1024 * 1024) # Read max 1MB
            html_content = html_bytes.decode('utf-8', errors='ignore')

        soup = BeautifulSoup(html_content, 'html.parser')

        # Remove scripts, styles, nav, footer
        for elem in soup(['script', 'style', 'noscript', 'header', 'footer', 'nav']):
            elem.extract()

        # Extract Page Title & Meta Description
        page_title = soup.title.string.strip() if soup.title and soup.title.string else ""
        og_title = ""
        og_desc = ""
        og_site = ""

        og_title_meta = soup.find('meta', property='og:title') or soup.find('meta', attrs={'name': 'og:title'})
        if og_title_meta and og_title_meta.get('content'):
            og_title = og_title_meta['content'].strip()

        og_desc_meta = soup.find('meta', property='og:description') or soup.find('meta', attrs={'name': 'description'})
        if og_desc_meta and og_desc_meta.get('content'):
            og_desc = og_desc_meta['content'].strip()

        og_site_meta = soup.find('meta', property='og:site_name')
        if og_site_meta and og_site_meta.get('content'):
            og_site = og_site_meta['content'].strip()

        # Extract Company & Job Title heuristic from titles
        title_source = og_title or page_title
        extracted_company = ""
        extracted_title = ""

        # Pattern: "Job Title at Company" or "Company hiring Job Title in Location"
        at_match = re.search(r'^(.*?)\s+(?:at|@|hiring for|hiring)\s+(.*?)(?:\s+in\s+.*|\s*[-|–].*)?$', title_source, re.IGNORECASE)
        if at_match:
            extracted_title = at_match.group(1).strip()
            extracted_company = at_match.group(2).strip()
        else:
            # Fallback split by delimiters
            parts = re.split(r'[-|–•:]', title_source)
            if len(parts) >= 2:
                extracted_title = parts[0].strip()
                extracted_company = parts[1].strip()
            else:
                extracted_title = title_source[:80]
                extracted_company = og_site or urllib.parse.urlparse(target_url).netloc.replace('www.', '').split('.')[0].capitalize()

        # Extract main body text
        main_content = ""
        main_tag = soup.find('main') or soup.find('article') or soup.find('div', class_=re.compile(r'job-description|description|details|posting', re.I))
        if main_tag:
            main_content = main_tag.get_text(separator='\n', strip=True)
        else:
            main_content = soup.get_text(separator='\n', strip=True)

        clean_desc = "\n".join([line for line in main_content.split('\n') if len(line.strip()) > 3])
        if len(clean_desc) > 3000:
            clean_desc = clean_desc[:3000]

        if not clean_desc and og_desc:
            clean_desc = og_desc

        parsed_domain = urllib.parse.urlparse(target_url).netloc
        website_url = f"https://{parsed_domain}"

        # Extract any email
        emails_found = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', main_content)
        contact_email = emails_found[0] if emails_found else ""

        return jsonify({
            "url": target_url,
            "company_name": extracted_company[:100],
            "title": extracted_title[:100],
            "description": clean_desc[:4000],
            "email": contact_email,
            "website": website_url,
            "status": "success"
        })
    except Exception as e:
        logger.error(f"Error in /api/fetch-job-url: {e}")
        return jsonify({"error": f"Failed to auto-fetch job details: {str(e)}"}), 500

@app.route('/api/scams', methods=['GET'])
def get_scams():
    """Retrieve verified and community-reported recruitment scams with category filtering and search"""
    rate_err = apply_rate_limit(max_requests=60, window_seconds=60)
    if rate_err:
        return rate_err

    try:
        q = sanitize_text(request.args.get('q', ''), max_len=100).lower().strip()
        category = sanitize_text(request.args.get('category', ''), max_len=50).strip()

        with scams_lock:
            all_scams = list(scams_collection)

        results = all_scams
        if category and category.lower() not in {'all', 'all categories'}:
            results = [s for s in results if s.get('scam_type', '').lower() == category.lower()]

        if q:
            results = [
                s for s in results
                if q in s.get('company_name', '').lower()
                or q in s.get('job_title', '').lower()
                or q in s.get('description', '').lower()
                or q in s.get('contact_info', '').lower()
            ]

        # Sort by votes descending, then date
        results = sorted(results, key=lambda s: (s.get('votes', 0), s.get('date', '')), reverse=True)

        return jsonify({
            "total": len(results),
            "scams": results
        })
    except Exception as e:
        logger.error(f"Error in /api/scams: {e}")
        return jsonify({"error": "Failed to retrieve scams feed."}), 500

@app.route('/api/scams/report', methods=['POST'])
def report_scam():
    """Submit a new recruitment fraud / scam incident to the community alert board"""
    rate_err = apply_rate_limit(max_requests=5, window_seconds=60)
    if rate_err:
        return rate_err

    try:
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Valid JSON payload required."}), 400

        company_name = sanitize_text(data.get('company_name', ''), max_len=150).strip()
        job_title = sanitize_text(data.get('job_title', ''), max_len=150).strip()
        scam_type = sanitize_text(data.get('scam_type', 'Other'), max_len=50).strip()
        description = sanitize_text(data.get('description', ''), max_len=2000).strip()
        contact_info = sanitize_text(data.get('contact_info', ''), max_len=200).strip()
        demanded_amount = sanitize_text(data.get('demanded_amount', ''), max_len=50).strip()
        reported_by = sanitize_text(data.get('reported_by', 'Anonymous Reporter'), max_len=100).strip()

        if not company_name or len(company_name) < 2:
            return jsonify({"error": "Suspect Company Name is required."}), 400
        if not description or len(description) < 10:
            return jsonify({"error": "Please provide a detailed scam description (minimum 10 characters)."}), 400

        new_scam = {
            "id": f"scam-{int(time.time() * 1000)}",
            "company_name": company_name,
            "job_title": job_title or "Position Not Specified",
            "scam_type": scam_type or "General Fraud",
            "description": description,
            "contact_info": contact_info or "Not provided",
            "demanded_amount": demanded_amount or "N/A",
            "reported_by": reported_by or "Anonymous Reporter",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "votes": 1,
            "verified_fraud": True if any(w in description.lower() for w in ['deposit', 'fee', 'telegram', 'upi', 'gpay', 'stamp paper', 'fake']) else False
        }

        with scams_lock:
            scams_collection.insert(0, new_scam)
            atomic_save_json(SCAMS_FILE, scams_collection)

        return jsonify({
            "message": "Scam incident successfully published to community alert board!",
            "scam": new_scam
        })
    except Exception as e:
        logger.error(f"Error in /api/scams/report: {e}")
        return jsonify({"error": "Failed to submit scam report."}), 500

@app.route('/api/scams/<scam_id>/vote', methods=['POST'])
def vote_scam(scam_id):
    """Upvote / confirm a reported scam to increase visibility and warn more job seekers"""
    rate_err = apply_rate_limit(max_requests=20, window_seconds=60)
    if rate_err:
        return rate_err

    try:
        clean_id = sanitize_text(scam_id, max_len=50).strip()
        with scams_lock:
            scam = next((s for s in scams_collection if s.get('id') == clean_id), None)
            if not scam:
                return jsonify({"error": "Scam alert record not found."}), 404

            scam['votes'] = scam.get('votes', 0) + 1
            if scam['votes'] >= 5:
                scam['verified_fraud'] = True
            atomic_save_json(SCAMS_FILE, scams_collection)
            updated_votes = scam['votes']

        return jsonify({
            "message": "Vote recorded. Thank you for protecting the job seeker community!",
            "votes": updated_votes
        })
    except Exception as e:
        logger.error(f"Error in /api/scams/{scam_id}/vote: {e}")
        return jsonify({"error": "Failed to register vote."}), 500

# ============================================================================
# FRONTEND CATCH-ALL STATIC ROUTE (MUST BE LAST)
# ============================================================================
@app.route('/', defaults={'path': ''}, methods=['GET'])
@app.route('/<path:path>', methods=['GET'])
def serve_frontend(path):
    """Serve React frontend static build safely or fallback to index.html / status"""
    safe_path = os.path.normpath(path).lstrip(r'\/')
    target_file = os.path.join(FRONTEND_BUILD_DIR, safe_path)
    
    # Path traversal protection: Ensure target is within FRONTEND_BUILD_DIR
    if safe_path and os.path.exists(target_file) and target_file.startswith(FRONTEND_BUILD_DIR):
        return send_from_directory(FRONTEND_BUILD_DIR, safe_path)
    
    index_file = os.path.join(FRONTEND_BUILD_DIR, 'index.html')
    if os.path.exists(index_file):
        return send_from_directory(FRONTEND_BUILD_DIR, 'index.html')
    
    return jsonify({
        "message": "SAFE HIRE API is running!",
        "version": "2.2.0",
        "features": ["ML Ensemble", "MCA Registry", "CIN Verification", "Rate Limiting", "Security Hardening", "Offer Scanner", "Scam Board"],
        "status": "online"
    })

# ============================================================================
# APPLICATION ENTRYPOINT
# ============================================================================
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))
    host = os.environ.get('HOST', '0.0.0.0')
    logger.info("=" * 60)
    logger.info("SAFE HIRE: Secure Fake Company & Job Detection Server")
    logger.info(f"Registered users in database: {len(users_collection)}")
    logger.info(f"Logged verifications in database: {len(predictions_collection)}")
    logger.info(f"Known scam alerts in database: {len(scams_collection)}")
    logger.info(f"Listening on http://{host}:{port}")
    logger.info("=" * 60)
    app.run(debug=False, port=port, host=host)
