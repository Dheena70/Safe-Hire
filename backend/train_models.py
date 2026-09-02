import os
import re
import warnings
import joblib
import nltk
import numpy as np
import pandas as pd
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from scipy.sparse import hstack
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings('ignore')

# Download required NLTK resources safely
for resource in ['stopwords', 'wordnet']:
    try:
        nltk.download(resource, quiet=True)
    except Exception as e:
        print(f"NLTK download notice: {e}")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, '..', 'ml_models')
DATASETS_DIR = os.path.join(BASE_DIR, '..', 'datasets')


class JobFraudDetectorTrainer:
    def __init__(self):
        self.tfidf_vectorizer = TfidfVectorizer(max_features=5000, stop_words='english', ngram_range=(1, 2))
        self.scaler = StandardScaler()
        self.logistic_model = LogisticRegression(max_iter=1000, random_state=42)
        self.rf_model = RandomForestClassifier(n_estimators=150, max_depth=12, random_state=42)
        self.lemmatizer = WordNetLemmatizer()
        try:
            self.stop_words = set(stopwords.words('english'))
        except Exception:
            self.stop_words = set()

        # Suspicious keywords indicative of employment fraud
        self.suspicious_keywords = [
            'urgent', 'immediate', 'work from home', 'no experience', 'earn money',
            'quick money', 'easy money', 'payment required', 'training fee',
            'deposit', 'investment', 'unlimited earning', 'guaranteed job',
            'no interview', 'immediate hiring', 'start today', 'weekly payment',
            'daily payment', 'data entry', 'form filling', 'ad posting', 'click ads',
            'survey', 'registration fee', 'part time job', 'earn per day', 'zero investment',
            'processing fee', 'security deposit', 'wire transfer', 'crypto', 'gift card',
            'confidential', 'act fast', 'guaranteed returns', 'no skills required'
        ]

        # Professional keywords indicative of legitimate postings
        self.professional_keywords = [
            'software development', 'machine learning', 'data science', 'web development',
            'mobile development', 'cloud computing', 'devops', 'cybersecurity',
            'artificial intelligence', 'deep learning', 'backend', 'frontend',
            'full stack', 'database', 'api development', 'testing', 'ui/ux',
            'project management', 'business analysis', 'marketing', 'sales',
            'human resources', 'finance', 'accounting', 'research', 'analytics',
            'bachelor', 'master', 'degree', 'responsibilities', 'qualifications',
            'collaborate', 'agile', 'scrum', 'architecture', 'infrastructure',
            'mentorship', 'competitive salary', 'health insurance', '401k', 'benefits'
        ]

    def preprocess_text(self, text):
        """Clean and preprocess textual data"""
        if pd.isna(text) or not text:
            return ""
        text = str(text).lower()
        text = re.sub(r'[^a-zA-Z\s]', ' ', text)
        words = text.split()
        if self.stop_words:
            words = [self.lemmatizer.lemmatize(w) for w in words if w not in self.stop_words]
        else:
            words = [self.lemmatizer.lemmatize(w) for w in words]
        return ' '.join(words)

    def extract_features(self, df):
        """Extract both NLP and structured domain metadata features"""
        features = pd.DataFrame()

        # Clean text columns
        df['clean_description'] = df['description'].apply(self.preprocess_text)
        df['clean_title'] = df['title'].apply(self.preprocess_text)
        df['clean_company'] = df['company_name'].apply(self.preprocess_text)

        # Combined text representation for TF-IDF
        df['combined_text'] = df['clean_title'] + ' ' + df['clean_company'] + ' ' + df['clean_description']

        # Suspicious & professional keyword counts
        features['suspicious_keyword_count'] = df['clean_description'].apply(
            lambda x: sum(1 for kw in self.suspicious_keywords if kw in x)
        )
        features['professional_keyword_count'] = df['clean_description'].apply(
            lambda x: sum(1 for kw in self.professional_keywords if kw in x)
        )

        # Text length features
        features['description_length'] = df['description'].astype(str).apply(len)
        features['title_length'] = df['title'].astype(str).apply(len)
        features['company_name_length'] = df['company_name'].astype(str).apply(len)

        # Free email provider check
        def is_free_email(email):
            if pd.isna(email) or not str(email).strip():
                return 1
            free_domains = {'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediff.com', 'aol.com', 'mail.com'}
            if '@' in str(email):
                domain = str(email).split('@')[-1].lower()
                return 1 if domain in free_domains else 0
            return 1

        features['is_free_email'] = df['email'].apply(is_free_email)

        # Has website check
        def has_website(website):
            if pd.isna(website):
                return 0
            w = str(website).strip().lower()
            return 0 if not w or w in {'none', 'null', 'n/a', ''} else 1

        features['has_website'] = df['website'].apply(has_website)

        # Domain mismatch check
        def domain_mismatch(email, website):
            if pd.isna(email) or pd.isna(website) or not str(website).strip():
                return 1
            email_str = str(email).lower()
            if '@' not in email_str:
                return 1
            email_domain = email_str.split('@')[-1].strip()
            clean_web = str(website).lower().replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0].strip()
            if not clean_web:
                return 1
            return 0 if (email_domain in clean_web or clean_web in email_domain) else 1

        features['domain_mismatch'] = df.apply(
            lambda row: domain_mismatch(row.get('email', ''), row.get('website', '')), axis=1
        )

        # Generic company naming heuristics
        def is_generic_company(name):
            if pd.isna(name):
                return 1
            generic_patterns = {'consulting', 'services', 'solutions', 'technologies', 'global', 'hub', 'centre', 'enterprises'}
            words = set(str(name).lower().split())
            return 1 if len(words) <= 2 and any(w in generic_patterns for w in words) else 0

        features['is_generic_company'] = df['company_name'].apply(is_generic_company)

        # Generic job title patterns
        def is_generic_title(title):
            if pd.isna(title):
                return 1
            suspicious_titles = {'data entry', 'work from home', 'easy job', 'earn money', 'form filling', 'ad posting', 'survey worker'}
            t_lower = str(title).lower()
            return 1 if any(st in t_lower for st in suspicious_titles) else 0

        features['is_generic_title'] = df['title'].apply(is_generic_title)

        return features, df

    def build_comprehensive_dataset(self):
        """Build a comprehensive dataset with diverse real and fraudulent job postings"""
        legitimate_postings = [
            {
                'company_name': 'Microsoft India Pvt Ltd',
                'title': 'Software Development Engineer Intern',
                'description': 'We are looking for a Software Development Engineer Intern to join our Azure cloud engineering team. Responsibilities include building scalable distributed backend services, designing APIs, and writing automated unit tests. Qualifications include proficiency in C#, Java, or Python, data structures, and algorithms.',
                'email': 'careers@microsoft.com',
                'website': 'https://www.microsoft.com',
                'is_fake': 0
            },
            {
                'company_name': 'Google India Private Limited',
                'title': 'Data Science & Machine Learning Engineer',
                'description': 'Join Google AI research and development group. You will work on productionizing deep learning architectures, analyzing user metrics, and scaling machine learning pipelines. Requirements: BS/MS in Computer Science or Statistics, strong Python and TensorFlow/PyTorch experience.',
                'email': 'recruiting@google.com',
                'website': 'https://careers.google.com',
                'is_fake': 0
            },
            {
                'company_name': 'Amazon Development Center India',
                'title': 'Cloud DevOps Solutions Architect',
                'description': 'Amazon Web Services is seeking a talented DevOps Engineer. Build automated CI/CD deployment pipelines, manage Kubernetes clusters, and optimize cloud infrastructure costs. Bachelor degree in Engineering and 2+ years of AWS experience required.',
                'email': 'jobs-aws@amazon.com',
                'website': 'https://amazon.jobs',
                'is_fake': 0
            },
            {
                'company_name': 'Tata Consultancy Services Limited',
                'title': 'Full Stack Web Application Developer',
                'description': 'TCS is hiring Full Stack Developers. Key responsibilities: Develop responsive single-page web applications using React, Node.js, and PostgreSQL. Participate in agile sprints and client architectural reviews. Excellent communication skills required.',
                'email': 'talent.acquisition@tcs.com',
                'website': 'https://www.tcs.com',
                'is_fake': 0
            },
            {
                'company_name': 'Infosys Limited',
                'title': 'Cybersecurity Analyst',
                'description': 'Infosys Security practice is hiring a Cybersecurity Analyst. Monitor security operations center (SOC) alerts, perform vulnerability assessments, and implement zero-trust network protocols. Certifications like CEH or CISSP preferred.',
                'email': 'careers@infosys.com',
                'website': 'https://www.infosys.com',
                'is_fake': 0
            },
            {
                'company_name': 'Zoho Corporation Private Limited',
                'title': 'Product Support & Quality Assurance Engineer',
                'description': 'Zoho is looking for passionate QA and Support Engineers. Responsibilities involve automated regression testing using Selenium, documenting defects, and working closely with engineering leads. Degree in Computer Applications or equivalent.',
                'email': 'hr@zohocorp.com',
                'website': 'https://www.zoho.com',
                'is_fake': 0
            },
            {
                'company_name': 'Wipro Technologies',
                'title': 'Data Analyst - Business Intelligence',
                'description': 'Analyze large enterprise datasets, design PowerBI and Tableau interactive dashboards, and optimize SQL queries for corporate stakeholders. Strong background in relational databases and financial modeling required.',
                'email': 'campus@wipro.com',
                'website': 'https://www.wipro.com',
                'is_fake': 0
            },
            {
                'company_name': 'HCL Technologies Ltd',
                'title': 'Mobile Application Developer (iOS/Android)',
                'description': 'Design and maintain high-performance mobile applications using Flutter and Swift. Collaborate with UI/UX designers to create seamless user interfaces. Competitive salary and healthcare coverage provided.',
                'email': 'talent@hcltech.com',
                'website': 'https://www.hcltech.com',
                'is_fake': 0
            },
            {
                'company_name': 'Freshworks Inc',
                'title': 'Backend Systems Engineer',
                'description': 'Join Freshworks Customer Experience platform. Develop high-throughput microservices in Go and Ruby on Rails. Experience with Kafka and Redis caching required. We offer stock options and hybrid work options.',
                'email': 'careers@freshworks.com',
                'website': 'https://www.freshworks.com',
                'is_fake': 0
            },
            {
                'company_name': 'Larsen & Toubro Infotech',
                'title': 'Embedded Systems & IoT Firmware Engineer',
                'description': 'Design firmware for industrial IoT gateways. Write efficient C/C++ code for ARM microcontrollers, implement MQTT protocols, and debug hardware interfaces. Degree in Electrical or Computer Engineering required.',
                'email': 'careers@lntinfotech.com',
                'website': 'https://www.lntinfotech.com',
                'is_fake': 0
            }
        ]

        fraudulent_postings = [
            {
                'company_name': 'Quick Money Solutions',
                'title': 'Work From Home Data Entry Intern',
                'description': 'Urgent requirement! Earn 5000 per day from home with zero experience. Simple copy-paste and form filling work. Immediate hiring with no interview required. Weekly guaranteed payment directly to bank account.',
                'email': 'quickmoneysolutions@gmail.com',
                'website': '',
                'is_fake': 1
            },
            {
                'company_name': 'Urgent Hiring Pvt Ltd',
                'title': 'Online Form Filling & Ad Posting Operator',
                'description': 'Immediate start required! Earn unlimited cash daily. Work from home 1 hour a day. Mandatory refundable registration fee of 1500 for training material and certificate before starting work.',
                'email': 'urgent.recruitment2024@yahoo.com',
                'website': '',
                'is_fake': 1
            },
            {
                'company_name': 'Easy Earn Technologies',
                'title': 'SMS Sending and Survey Assistant',
                'description': 'Earn easy money with guaranteed weekly returns. No interview, no resume needed. Small initial deposit required for software activation. Start earning within 2 hours.',
                'email': 'easyearn.jobs@hotmail.com',
                'website': '',
                'is_fake': 1
            },
            {
                'company_name': 'Global Online Services Hub',
                'title': 'Part Time Typing and Captcha Solver',
                'description': 'Work from home typing simple documents. High salary guaranteed with no prior skills. Processing fee required for candidate verification ID card. Immediate placement.',
                'email': 'globalservices.work@gmail.com',
                'website': '',
                'is_fake': 1
            },
            {
                'company_name': 'Instant Job Solutions',
                'title': 'Customer Support Chat Agent - WFH',
                'description': 'Immediate hiring for chat support. Earn high daily wages with instant bank transfer. Must purchase training kit via Google Pay/PhonePe before onboarding.',
                'email': 'instantjobs99@rediffmail.com',
                'website': '',
                'is_fake': 1
            },
            {
                'company_name': 'Fast Cash Enterprises',
                'title': 'Crypto Investment and Reviewer Intern',
                'description': 'Earn 10000 daily by rating apps and completing crypto wire tasks. Guaranteed profit sharing. Zero risk, urgent vacancy, limited seats available!',
                'email': 'fastcashreviews@gmail.com',
                'website': '',
                'is_fake': 1
            },
            {
                'company_name': 'Online Career Portal Inc',
                'title': 'Data Entry Operator - No Skills Needed',
                'description': 'Earn money fast! 100% genuine work from home. Registration fee required for laptop courier. Confidential urgent opening.',
                'email': 'onlinecareerportal@outlook.com',
                'website': '',
                'is_fake': 1
            },
            {
                'company_name': 'Global Consulting Services',
                'title': 'Survey Filling Specialist',
                'description': 'Fill simple online surveys and earn instant gift cards and cash. Payment required for registration certificate. Act fast today!',
                'email': 'globalconsulting77@yahoo.com',
                'website': '',
                'is_fake': 1
            },
            {
                'company_name': 'Direct Hire Technologies',
                'title': 'Virtual Assistant - Daily Payout',
                'description': 'No experience required! Guaranteed job offer without interview. Security deposit required before issuing offer letter. Immediate joining.',
                'email': 'directhireteam@mail.com',
                'website': '',
                'is_fake': 1
            },
            {
                'company_name': 'Express Employment Solutions',
                'title': 'Part Time Ad Reviewer',
                'description': 'Make money from mobile phone anywhere. Daily payment guaranteed. Training fees must be deposited before job assignment is released.',
                'email': 'expressemploy.help@gmail.com',
                'website': '',
                'is_fake': 1
            }
        ]

        # Combine seed data
        all_records = legitimate_postings + fraudulent_postings

        # Expand dataset with varied realistic descriptions and variations
        expanded_records = []
        for i in range(25):
            for item in all_records:
                copy_item = item.copy()
                if copy_item['is_fake'] == 0:
                    skills_variations = [
                        'Must have strong problem solving abilities and good team collaboration.',
                        'Experience with Git version control, unit testing, and Agile development is a plus.',
                        'Competitive compensation package including medical benefits, PTO, and stock options.',
                        'Candidates must hold a Bachelor of Science or relevant technical qualification.',
                        'Mentorship from senior staff and structured career progression paths.'
                    ]
                    copy_item['description'] = copy_item['description'] + ' ' + skills_variations[i % len(skills_variations)]
                else:
                    scam_variations = [
                        'Limited slots remaining. Act fast to secure your spot today!',
                        'Deposit refundable security amount to confirm your appointment.',
                        'No qualifications or educational background required. Quick cash daily!',
                        'Immediate joining letter sent upon payment confirmation.',
                        'Earn 50000 per month easily with zero effort and no supervisor.'
                    ]
                    copy_item['description'] = copy_item['description'] + ' ' + scam_variations[i % len(scam_variations)]

                expanded_records.append(copy_item)

        df = pd.DataFrame(all_records + expanded_records)
        return df

    def train(self):
        """Train both Logistic Regression and Random Forest models"""
        print("1. Generating comprehensive training dataset...")
        df = self.build_comprehensive_dataset()
        print(f"   [OK] Dataset created with {len(df)} records ({sum(df['is_fake'] == 0)} real, {sum(df['is_fake'] == 1)} fake)")

        print("2. Extracting NLP & structured metadata features...")
        features, df_processed = self.extract_features(df)

        print("3. Vectorizing text features with TF-IDF...")
        text_features = self.tfidf_vectorizer.fit_transform(df_processed['combined_text'])

        print("4. Normalizing metadata features...")
        scaled_features = self.scaler.fit_transform(features)

        # Combine numerical & text features
        X = hstack([scaled_features, text_features])
        y = df['is_fake'].values

        # Split into training and test sets
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

        print("5. Training Logistic Regression model...")
        self.logistic_model.fit(X_train, y_train)
        lr_preds = self.logistic_model.predict(X_test)
        lr_acc = accuracy_score(y_test, lr_preds)
        print(f"   [OK] Logistic Regression Accuracy: {lr_acc * 100:.2f}%")

        print("6. Training Random Forest Classifier...")
        self.rf_model.fit(X_train, y_train)
        rf_preds = self.rf_model.predict(X_test)
        rf_acc = accuracy_score(y_test, rf_preds)
        print(f"   [OK] Random Forest Accuracy: {rf_acc * 100:.2f}%")

        return lr_acc, rf_acc

    def save_models(self):
        """Save trained models to ml_models directory with standardized and alias filenames"""
        os.makedirs(MODELS_DIR, exist_ok=True)
        print(f"Saving models to {MODELS_DIR}...")

        # Standardized model artifacts
        joblib.dump(self.tfidf_vectorizer, os.path.join(MODELS_DIR, 'tfidf_vectorizer.joblib'))
        joblib.dump(self.scaler, os.path.join(MODELS_DIR, 'scaler.joblib'))
        joblib.dump(self.scaler, os.path.join(MODELS_DIR, 'meta_scaler.joblib'))  # Alias
        joblib.dump(self.logistic_model, os.path.join(MODELS_DIR, 'logistic_model.joblib'))
        joblib.dump(self.rf_model, os.path.join(MODELS_DIR, 'rf_model.joblib'))
        joblib.dump(self.rf_model, os.path.join(MODELS_DIR, 'random_forest_model.joblib'))  # Alias

        print("[OK] All model artifacts successfully saved!")


if __name__ == '__main__':
    print("=" * 60)
    print("SAFE HIRE: ML Model Training & Feature Pipeline")
    print("=" * 60)
    trainer = JobFraudDetectorTrainer()
    trainer.train()
    trainer.save_models()
    print("=" * 60)
