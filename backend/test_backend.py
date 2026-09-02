import json
import os
import sys
from app import app, detector, users_collection, predictions_collection

print("=" * 60)
print("RUNNING SAFE HIRE BACKEND TEST SUITE (v2.1 with CIN & Optional Fields)")
print("=" * 60)

# Check model loading
print("\n[Test 1] Checking ML detector initialization...")
assert detector is not None, "Detector is None!"
assert detector.tfidf_vectorizer is not None, "TF-IDF vectorizer not loaded!"
assert detector.scaler is not None, "Scaler not loaded!"
assert detector.logistic_model is not None, "Logistic model not loaded!"
assert detector.rf_model is not None, "Random Forest model not loaded!"
print("  [PASS] All 4 ML models loaded successfully.")

# Create test client
client = app.test_client()

# Test Root
print("\n[Test 2] Testing GET /...")
res = client.get('/')
assert res.status_code == 200
print(f"  [PASS] Root response: {res.json}")

# Test Visitors
print("\n[Test 3] Testing POST /api/visitors...")
res = client.post('/api/visitors')
assert res.status_code == 200
assert 'visitor_count' in res.json
print(f"  [PASS] Visitor count: {res.json['visitor_count']}")

# Test Predict: Real Company with CIN
print("\n[Test 4] Testing POST /predict (Real Company with MCA CIN)...")
real_cin_payload = {
    "company_name": "Microsoft India Private Limited",
    "title": "Software Development Engineer Intern",
    "description": "Join our Azure cloud engineering team. Responsibilities include building scalable distributed backend services, designing APIs, and writing automated unit tests. Qualifications include proficiency in C#, Java, or Python, data structures, and algorithms.",
    "email": "careers@microsoft.com",
    "website": "https://www.microsoft.com",
    "cin": "U74140DL1995PTC067938"
}
res = client.post('/predict', json=real_cin_payload)
assert res.status_code == 200, f"Status: {res.status_code}, Body: {res.data}"
pred_cin = res.json
print(f"  Result: {pred_cin['prediction']}, Confidence: {pred_cin['probability']*100:.1f}%, Risk: {pred_cin['risk_level']}, CIN Status: {pred_cin.get('cin_verified')}")
assert pred_cin['prediction'] == 'REAL', f"Expected REAL, got {pred_cin['prediction']}"
assert pred_cin['risk_level'] == 'Low', f"Expected Low risk, got {pred_cin['risk_level']}"
assert pred_cin.get('cin_verified') is True, f"Expected CIN verified True, got {pred_cin.get('cin_verified')}"
print("  [PASS] Company with MCA CIN correctly verified as REAL with Low risk.")

# Test Predict: Real Company with NO Email and NO Website (Optional Fields)
print("\n[Test 5] Testing POST /predict (Company without Email or Website)...")
no_email_payload = {
    "company_name": "Tata Consultancy Services Limited",
    "title": "Cloud Infrastructure Associate",
    "description": "TCS is hiring Cloud Infrastructure Engineers. Responsibilities involve configuring secure enterprise networks, monitoring Kubernetes deployments, and collaborating on global client projects. Bachelor degree in Engineering required."
}
res = client.post('/predict', json=no_email_payload)
assert res.status_code == 200, f"Status: {res.status_code}, Body: {res.data}"
pred_no_email = res.json
print(f"  Result: {pred_no_email['prediction']}, Confidence: {pred_no_email['probability']*100:.1f}%, Risk: {pred_no_email['risk_level']}")
assert pred_no_email['prediction'] == 'REAL', f"Expected REAL without email/web, got {pred_no_email['prediction']}"
print("  [PASS] Job verified successfully without requiring email or website.")

# Test Predict: Scam Company
print("\n[Test 6] Testing POST /predict (Known Scam Company)...")
scam_payload = {
    "company_name": "Quick Money Solutions",
    "title": "Work From Home Data Entry Intern",
    "description": "Urgent requirement! Earn 5000 per day from home with zero experience. Simple copy-paste and form filling work. Immediate hiring with no interview required. Weekly guaranteed payment directly to bank account.",
    "email": "quickmoneysolutions@gmail.com"
}
res = client.post('/predict', json=scam_payload)
assert res.status_code == 200
pred_scam = res.json
print(f"  Result: {pred_scam['prediction']}, Confidence: {pred_scam['probability']*100:.1f}%, Risk: {pred_scam['risk_level']}")
assert pred_scam['prediction'] == 'FAKE', f"Expected FAKE, got {pred_scam['prediction']}"
assert pred_scam['risk_level'] == 'High', f"Expected High risk, got {pred_scam['risk_level']}"
assert 'FLAGGED' in pred_scam['scam_status'], f"Expected FLAGGED in scam status, got {pred_scam['scam_status']}"
print("  [PASS] Fraudulent job correctly classified as FAKE with High risk and flagged in scam DB.")

# Test Auth: Register Admin
print("\n[Test 7] Testing User Registration & Login...")
test_email = f"test_admin_{os.getpid()}@example.com"
reg_payload = {
    "name": "Test Administrator",
    "email": test_email,
    "password": "Password123!"
}
res = client.post('/auth/register', json=reg_payload)
assert res.status_code in [200, 400]

login_res = client.post('/auth/login', json={"email": test_email, "password": "Password123!"})
assert login_res.status_code == 200, f"Login failed: {login_res.data}"
token = login_res.json['access_token']
print(f"  [PASS] Registered and logged in successfully. User role: {login_res.json['user']['role']}")

# Test Admin Analytics
print("\n[Test 8] Testing GET /admin/analytics...")
admin_email = "admin@example.com"
client.post('/auth/register', json={"name": "Super Admin", "email": admin_email, "password": "AdminPassword123!"})
admin_login = client.post('/auth/login', json={"email": admin_email, "password": "AdminPassword123!"})
admin_token = admin_login.json['access_token']

analytics_res = client.get('/admin/analytics', headers={"Authorization": f"Bearer {admin_token}"})
assert analytics_res.status_code == 200, f"Analytics failed: {analytics_res.data}"
analytics_data = analytics_res.json
assert 'total_predictions' in analytics_data
assert 'real_predictions' in analytics_data
assert 'fake_predictions' in analytics_data
assert 'risk_distribution' in analytics_data
assert 'recent_predictions' in analytics_data
print(f"  [PASS] /admin/analytics returned: Total={analytics_data['total_predictions']}, Real={analytics_data['real_predictions']}, Fake={analytics_data['fake_predictions']}, Recent={len(analytics_data['recent_predictions'])}")

print("\n" + "=" * 60)
print("ALL 8 BACKEND TESTS PASSED SUCCESSFULLY! [OK]")
print("=" * 60)
