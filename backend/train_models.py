import pandas as pd
import numpy as np
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import joblib
import warnings
warnings.filterwarnings('ignore')

# Download NLTK data
nltk.download('stopwords')
nltk.download('wordnet')

class JobFraudDetector:
    def __init__(self):
        self.tfidf_vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
        self.scaler = StandardScaler()
        self.logistic_model = LogisticRegression(random_state=42)
        self.rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
        
        # Suspicious keywords for fake jobs
        self.suspicious_keywords = [
            'urgent', 'immediate', 'work from home', 'no experience', 'earn money',
            'quick money', 'easy money', 'payment required', 'training fee',
            'deposit', 'investment', 'unlimited earning', 'guaranteed job',
            'no interview', 'immediate hiring', 'start today', 'weekly payment',
            'data entry', 'form filling', 'ad posting', 'click ads', 'survey'
        ]
        
        # Professional keywords for legitimate jobs
        self.professional_keywords = [
            'software development', 'machine learning', 'data science', 'web development',
            'mobile development', 'cloud computing', 'devops', 'cybersecurity',
            'artificial intelligence', 'deep learning', 'backend', 'frontend',
            'full stack', 'database', 'api development', 'testing', 'ui/ux',
            'project management', 'business analysis', 'marketing', 'sales',
            'human resources', 'finance', 'accounting', 'research', 'analytics'
        ]

    def preprocess_text(self, text):
        """Clean and preprocess text data"""
        if pd.isna(text):
            return ""
        
        text = str(text).lower()
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        words = text.split()
        words = [self.lemmatizer.lemmatize(word) for word in words if word not in self.stop_words]
        return ' '.join(words)

    def extract_features(self, df):
        """Extract features from the dataset"""
        features = pd.DataFrame()
        
        # Text preprocessing
        df['clean_description'] = df['description'].apply(self.preprocess_text)
        df['clean_title'] = df['title'].apply(self.preprocess_text)
        df['clean_company'] = df['company_name'].apply(self.preprocess_text)
        
        # Suspicious keyword count
        features['suspicious_keyword_count'] = df['clean_description'].apply(
            lambda x: sum(1 for keyword in self.suspicious_keywords if keyword in x)
        )
        
        # Professional keyword count
        features['professional_keyword_count'] = df['clean_description'].apply(
            lambda x: sum(1 for keyword in self.professional_keywords if keyword in x)
        )
        
        # Text length features
        features['description_length'] = df['description'].astype(str).apply(len)
        features['title_length'] = df['title'].astype(str).apply(len)
        features['company_name_length'] = df['company_name'].astype(str).apply(len)
        
        # Email domain features
        def is_free_email(email):
            if pd.isna(email):
                return 1
            free_domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediff.com']
            return 1 if any(domain in str(email).lower() for domain in free_domains) else 0
        
        features['is_free_email'] = df['email'].apply(is_free_email)
        
        # Website features
        def has_website(website):
            return 0 if pd.isna(website) or str(website).strip() == '' else 1
        
        features['has_website'] = df['website'].apply(has_website)
        
        # Domain mismatch feature
        def domain_mismatch(email, website):
            if pd.isna(email) or pd.isna(website):
                return 1
            email_domain = str(email).split('@')[-1].lower() if '@' in str(email) else ''
            website_domain = str(website).lower()
            return 0 if email_domain and email_domain in website_domain else 1
        
        features['domain_mismatch'] = df.apply(
            lambda row: domain_mismatch(row['email'], row['website']), axis=1
        )
        
        # Company name patterns
        def is_generic_company(name):
            if pd.isna(name):
                return 1
            generic_patterns = ['consulting', 'services', 'solutions', 'technologies', 'pvt ltd', 'llp']
            name_lower = str(name).lower()
            return 1 if any(pattern in name_lower for pattern in generic_patterns) else 0
        
        features['is_generic_company'] = df['company_name'].apply(is_generic_company)
        
        # Title patterns
        def is_generic_title(title):
            if pd.isna(title):
                return 1
            generic_patterns = ['intern', 'trainee', 'fresher', 'entry level', 'junior']
            title_lower = str(title).lower()
            return 1 if any(pattern in title_lower for pattern in generic_patterns) else 0
        
        features['is_generic_title'] = df['title'].apply(is_generic_title)
        
        return features, df

    def create_sample_dataset(self):
        """Create a sample dataset for training"""
        # Legitimate job examples
        legitimate_data = [
            {
                'company_name': 'Microsoft India',
                'title': 'Software Development Intern',
                'description': 'Join our team to work on cutting-edge software development projects. You will learn about cloud computing, artificial intelligence, and modern development practices.',
                'email': 'careers@microsoft.com',
                'website': 'https://www.microsoft.com',
                'is_fake': 0
            },
            {
                'company_name': 'Google India',
                'title': 'Data Science Intern',
                'description': 'Work with our data science team on machine learning models and data analysis. Strong programming skills required.',
                'email': 'careers@google.com',
                'website': 'https://www.google.com',
                'is_fake': 0
            },
            {
                'company_name': 'Amazon India',
                'title': 'Cloud Computing Intern',
                'description': 'Learn about AWS services and cloud infrastructure. Work on real-world projects with our engineering team.',
                'email': 'careers@amazon.in',
                'website': 'https://www.amazon.in',
                'is_fake': 0
            },
            {
                'company_name': 'TCS',
                'title': 'Full Stack Development Intern',
                'description': 'Develop web applications using modern frameworks. Database design and API development experience preferred.',
                'email': 'careers@tcs.com',
                'website': 'https://www.tcs.com',
                'is_fake': 0
            },
            {
                'company_name': 'Infosys',
                'title': 'Machine Learning Intern',
                'description': 'Work on ML projects including natural language processing and computer vision. Python and TensorFlow knowledge required.',
                'email': 'careers@infosys.com',
                'website': 'https://www.infosys.com',
                'is_fake': 0
            }
        ]
        
        # Fake job examples
        fake_data = [
            {
                'company_name': 'Quick Money Solutions',
                'title': 'Work From Home Intern',
                'description': 'Earn money immediately with no experience required. Easy data entry work. Weekly payment guaranteed. No interview needed.',
                'email': 'quickmoney@gmail.com',
                'website': '',
                'is_fake': 1
            },
            {
                'company_name': 'Urgent Hiring Pvt Ltd',
                'title': 'Data Entry Operator',
                'description': 'Immediate start! Work from home opportunity. Form filling job with unlimited earning potential. Training fee required.',
                'email': 'urgent.hiring@yahoo.com',
                'website': '',
                'is_fake': 1
            },
            {
                'company_name': 'Easy Earn Technologies',
                'title': 'Ad Posting Intern',
                'description': 'No experience needed. Earn money by posting ads online. Guaranteed income. Start today with small investment.',
                'email': 'easyearn@hotmail.com',
                'website': '',
                'is_fake': 1
            },
            {
                'company_name': 'Global Consulting Services',
                'title': 'Survey Filler',
                'description': 'Work from home filling surveys. Quick money guaranteed. Payment required for registration. Immediate hiring.',
                'email': 'global.consulting@gmail.com',
                'website': '',
                'is_fake': 1
            },
            {
                'company_name': 'Instant Job Solutions',
                'title': 'Form Filling Intern',
                'description': 'No interview required. Earn money easily from home. Data entry work with weekly payments. Limited seats available.',
                'email': 'instant.job@yahoo.com',
                'website': '',
                'is_fake': 1
            }
        ]
        
        # Combine and create DataFrame
        all_data = legitimate_data + fake_data
        df = pd.DataFrame(all_data)
        
        # Add more variations by duplicating with slight changes
        additional_data = []
        for _ in range(10):  # Create 10 more variations
            for data in all_data:
                new_data = data.copy()
                # Add some random variations
                if new_data['is_fake'] == 0:
                    new_data['description'] += ' ' + np.random.choice(['Python required', 'Java preferred', 'SQL knowledge needed'])
                else:
                    new_data['description'] += ' ' + np.random.choice(['Limited time offer', 'Act fast', 'Special discount'])
                additional_data.append(new_data)
        
        df_extended = pd.DataFrame(all_data + additional_data)
        return df_extended

    def train(self):
        """Train the ML models"""
        print("Creating sample dataset...")
        df = self.create_sample_dataset()
        
        print("Extracting features...")
        features, df_processed = self.extract_features(df)
        
        # Create TF-IDF features from text
        text_features = self.tfidf_vectorizer.fit_transform(df_processed['clean_description'])
        
        # Combine numerical and text features
        numerical_features = self.scaler.fit_transform(features)
        
        # Combine all features
        from scipy.sparse import hstack
        X = hstack([numerical_features, text_features])
        y = df['is_fake']
        
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train Logistic Regression
        print("Training Logistic Regression model...")
        self.logistic_model.fit(X_train, y_train)
        lr_pred = self.logistic_model.predict(X_test)
        print("Logistic Regression Accuracy:", accuracy_score(y_test, lr_pred))
        
        # Train Random Forest
        print("Training Random Forest model...")
        self.rf_model.fit(X_train, y_train)
        rf_pred = self.rf_model.predict(X_test)
        print("Random Forest Accuracy:", accuracy_score(y_test, rf_pred))
        
        print("Models trained successfully!")
        
        return accuracy_score(y_test, lr_pred), accuracy_score(y_test, rf_pred)

    def save_models(self):
        """Save trained models"""
        joblib.dump(self.tfidf_vectorizer, '../ml_models/tfidf_vectorizer.joblib')
        joblib.dump(self.scaler, '../ml_models/meta_scaler.joblib')
        joblib.dump(self.logistic_model, '../ml_models/logistic_model.joblib')
        joblib.dump(self.rf_model, '../ml_models/rf_model.joblib')
        print("Models saved successfully!")

    def predict_record(self, company_name, title, description, email, website):
        """Predict if a single record is fake or real"""
        # Create DataFrame for single record
        record_df = pd.DataFrame([{
            'company_name': company_name,
            'title': title,
            'description': description,
            'email': email,
            'website': website
        }])
        
        # Extract features
        features, df_processed = self.extract_features(record_df)
        
        # Create TF-IDF features
        text_features = self.tfidf_vectorizer.transform(df_processed['clean_description'])
        
        # Scale numerical features
        numerical_features = self.scaler.transform(features)
        
        # Combine features
        from scipy.sparse import hstack
        X = hstack([numerical_features, text_features])
        
        # Make predictions
        lr_pred = self.logistic_model.predict(X)[0]
        lr_prob = self.logistic_model.predict_proba(X)[0][1]
        
        rf_pred = self.rf_model.predict(X)[0]
        rf_prob = self.rf_model.predict_proba(X)[0][1]
        
        # Ensemble prediction (average probability)
        ensemble_prob = (lr_prob + rf_prob) / 2
        ensemble_pred = 1 if ensemble_prob > 0.5 else 0
        
        return {
            'prediction': 'FAKE' if ensemble_pred == 1 else 'REAL',
            'probability': ensemble_prob,
            'lr_prediction': 'FAKE' if lr_pred == 1 else 'REAL',
            'lr_probability': lr_prob,
            'rf_prediction': 'FAKE' if rf_pred == 1 else 'REAL',
            'rf_probability': rf_prob
        }

if __name__ == "__main__":
    # Create and train the model
    detector = JobFraudDetector()
    
    # Train the models
    lr_acc, rf_acc = detector.train()
    
    # Save the models
    detector.save_models()
    
    # Test with sample data
    print("\nTesting with sample data:")
    test_result = detector.predict_record(
        "Test Company",
        "Software Intern",
        "Work on software development projects with our team",
        "careers@testcompany.com",
        "https://www.testcompany.com"
    )
    print("Test Result:", test_result)
