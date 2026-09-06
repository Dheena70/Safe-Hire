import json
import os
import sys

# Ensure environment is configured for testing
os.environ['JWT_SECRET_KEY'] = 'test-security-secret-key-for-test-suite-32-chars!'
os.environ['ADMIN_EMAILS'] = 'admin@example.com,test_admin@example.com'

from app import app, detector, users_collection, predictions_collection

print("=" * 65)
print("SAFE HIRE: COMPREHENSIVE SECURITY & INTEGRATION TEST SUITE (v2.2)")
print("=" * 65)

# 1. Check ML Models Loading
print("\n[Test 1] Checking ML detector initialization...")
assert detector is not None, "Detector is None!"
assert detector.tfidf_vectorizer is not None, "TF-IDF vectorizer not loaded!"
assert detector.scaler is not None, "Scaler not loaded!"
assert detector.logistic_model is not None, "Logistic model not loaded!"
assert detector.rf_model is not None, "Random Forest model not loaded!"
print("  [PASS] All 4 ML models loaded securely.")

client = app.test_client()

# 2. Security Headers Verification
print("\n[Test 2] Testing Security HTTP Headers...")
res = client.get('/')
headers = res.headers
assert headers.get('X-Content-Type-Options') == 'nosniff', "Missing nosniff header!"
assert headers.get('X-Frame-Options') == 'DENY', "Missing X-Frame-Options header!"
assert 'default-src' in headers.get('Content-Security-Policy', ''), "Missing CSP header!"
print(f"  [PASS] Security headers verified: nosniff, DENY, CSP present.")

# 3. Visitors API
print("\n[Test 3] Testing POST /api/visitors...")
res = client.post('/api/visitors')
assert res.status_code == 200
assert 'visitor_count' in res.json
print(f"  [PASS] Visitor counter returned: {res.json['visitor_count']}")

# 4. Predict: Legitimate Company with MCA CIN
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
print(f"  Result: {pred_cin['prediction']}, Confidence: {pred_cin['probability']*100:.1f}%, Risk: {pred_cin['risk_level']}, CIN: {pred_cin.get('cin_verified')}")
assert pred_cin['prediction'] == 'REAL', f"Expected REAL, got {pred_cin['prediction']}"
assert pred_cin['risk_level'] == 'Low', f"Expected Low risk, got {pred_cin['risk_level']}"
assert pred_cin.get('cin_verified') is True, f"Expected CIN verified True, got {pred_cin.get('cin_verified')}"
print("  [PASS] Verified MCA entity classified as REAL with Low risk.")

# 5. Predict: Optional Email & Website
print("\n[Test 5] Testing POST /predict (Company without Email/Website)...")
no_email_payload = {
    "company_name": "Tata Consultancy Services Limited",
    "title": "Cloud Infrastructure Associate",
    "description": "TCS is hiring Cloud Infrastructure Engineers. Responsibilities involve configuring secure enterprise networks, monitoring Kubernetes deployments, and collaborating on global client projects. Bachelor degree in Engineering required."
}
res = client.post('/predict', json=no_email_payload)
assert res.status_code == 200
pred_no_email = res.json
assert pred_no_email['prediction'] == 'REAL'
print(f"  [PASS] Job verified without email/website: {pred_no_email['prediction']}")

# 6. Predict: Scam Detection
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
assert pred_scam['prediction'] == 'FAKE'
assert pred_scam['risk_level'] == 'High'
print(f"  [PASS] Scam classified as FAKE with High risk ({pred_scam['scam_status']}).")

# 7. Input Validation Security (Missing/Invalid payloads)
print("\n[Test 7] Testing Input Validation & Sanitization...")
res = client.post('/predict', json={"company_name": ""})
assert res.status_code == 400
assert "Company Name is required" in res.json.get('error', '')

res = client.post('/predict', json={
    "company_name": "Valid Corp",
    "title": "Engineer",
    "description": "Short",
    "email": "invalid-email-format"
})
assert res.status_code == 400
assert "email format is invalid" in res.json.get('error', '')
print("  [PASS] Server-side validation rejected malformed payloads.")

# 8. Password Policy & Complexity Verification
print("\n[Test 8] Testing Password Complexity Policy...")
res = client.post('/auth/register', json={
    "name": "User One",
    "email": "user_weak@example.com",
    "password": "123"  # Too short
})
assert res.status_code == 400
assert "at least 8 characters" in res.json.get('error', '')

res = client.post('/auth/register', json={
    "name": "User Two",
    "email": "user_weak2@example.com",
    "password": "password"  # Common weak
})
assert res.status_code == 400
assert "too common" in res.json.get('error', '')
print("  [PASS] Weak passwords properly rejected.")

# 9. User Registration, Authentication & RBAC
print("\n[Test 9] Testing User Registration, Authentication & RBAC...")
user_email = f"standard_user_{os.getpid()}@example.com"
res = client.post('/auth/register', json={
    "name": "Standard User",
    "email": user_email,
    "password": "StrongPassword123!"
})
assert res.status_code == 200

# Login standard user
login_res = client.post('/auth/login', json={"email": user_email, "password": "StrongPassword123!"})
assert login_res.status_code == 200
user_token = login_res.json['access_token']
assert login_res.json['user']['role'] == 'user'

# Non-admin attempting to access /admin/analytics (Should be 403 Forbidden)
res = client.get('/admin/analytics', headers={"Authorization": f"Bearer {user_token}"})
assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}"
print("  [PASS] Non-admin user access to /admin/analytics successfully blocked (403 Forbidden).")

# Admin user registration & access
admin_email = f"test_admin_{os.getpid()}@example.com"
os.environ['ADMIN_EMAILS'] = f"admin@example.com,{admin_email}"
# Re-evaluate ADMIN_EMAILS for test
import app as app_module
app_module.ADMIN_EMAILS.add(admin_email)

res = client.post('/auth/register', json={
    "name": "Security Admin",
    "email": admin_email,
    "password": "AdminSecurePassword2026!"
})
assert res.status_code == 200

admin_login = client.post('/auth/login', json={"email": admin_email, "password": "AdminSecurePassword2026!"})
assert admin_login.status_code == 200
admin_token = admin_login.json['access_token']
assert admin_login.json['user']['role'] == 'admin'

analytics_res = client.get('/admin/analytics', headers={"Authorization": f"Bearer {admin_token}"})
assert analytics_res.status_code == 200
analytics_data = analytics_res.json
assert 'total_predictions' in analytics_data
assert 'risk_distribution' in analytics_data
print("  [PASS] Admin user successfully authorized to access /admin/analytics.")

# 10. Rate Limiting Protection Test
print("\n[Test 10] Testing Rate Limiting on Authentication...")
# Rapidly attempt 10 failed logins
exceeded = False
for _ in range(10):
    rate_test_res = client.post('/auth/login', json={"email": "nonexistent@example.com", "password": "WrongPassword123!"})
    if rate_test_res.status_code == 429:
        exceeded = True
        break
assert exceeded is True, "Rate limiter did not trigger 429 on rapid requests!"
print("  [PASS] Rate limiter triggered 429 Too Many Requests on abuse attempt.")

print("\n" + "=" * 65)
print("ALL 10 SECURITY & SYSTEM TESTS PASSED SUCCESSFULLY! [OK]")
print("=" * 65)
