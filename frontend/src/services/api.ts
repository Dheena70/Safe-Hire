import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL !== undefined 
  ? process.env.REACT_APP_API_URL 
  : (process.env.NODE_ENV === 'production' ? 'https://safe-hire.onrender.com' : 'http://localhost:5050');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Turns an axios error into a user-friendly message
export const describeApiError = (err: any): string => {
  if (err?.response?.data?.error) {
    return err.response.data.error;
  }
  if (err?.code === 'ECONNABORTED') {
    return 'The server took too long to respond. Is the backend service active?';
  }
  if (err?.request) {
    const targetUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'server');
    return `Could not reach the server at ${targetUrl}. Please ensure the backend is running and accessible.`;
  }
  return 'An unexpected error occurred.';
};

// Types
export interface PredictionRequest {
  company_name: string;
  title: string;
  description: string;
  email?: string;
  website?: string;
  cin?: string;
}

export interface PredictionResponse {
  prediction: 'REAL' | 'FAKE';
  probability: number; // Confidence in legitimacy (0.0 to 1.0)
  risk_level: 'Low' | 'Medium' | 'High';
  verification_status: string;
  scam_status: string;
  suspicious_score: number;
  tamil_nadu_registered?: boolean | string;
  cin_verified?: boolean | string;
  registered_company_name?: string | null;
  reasons?: string[];
  features?: any;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SendOtpRequest {
  identifier: string;
  method?: 'email' | 'phone';
}

export interface SendOtpResponse {
  message: string;
  target?: string;
  method?: string;
  otp_preview?: string;
  identifier?: string;
  expires_in_seconds?: number;
}

export interface VerifyOtpResetRequest {
  identifier?: string;
  email?: string;
  phone?: string;
  otp: string;
  new_password: string;
}

export interface ResetPasswordRequest {
  identifier?: string;
  email?: string;
  phone?: string;
  new_password: string;
  otp?: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    name: string;
    email: string;
    phone?: string;
    role: 'admin' | 'user';
    picture?: string;
  };
}

export interface GoogleAuthRequest {
  credential?: string;
  token?: string;
  access_token?: string;
  id_token?: string;
  email?: string;
  name?: string;
  google_id?: string;
  picture?: string;
}

export interface RecentPrediction {
  id: number;
  company_name: string;
  title: string;
  email?: string;
  website?: string;
  cin?: string;
  prediction: 'REAL' | 'FAKE';
  probability: number;
  risk_level: 'Low' | 'Medium' | 'High';
  verification_status: string;
  scam_status: string;
  cin_verified?: boolean | string;
  timestamp: string;
}

export interface AnalyticsData {
  total_predictions: number;
  fake_predictions: number;
  real_predictions: number;
  fake_percentage: number;
  risk_distribution: {
    high: number;
    medium: number;
    low: number;
  };
  predictions_summary?: {
    REAL: number;
    FAKE: number;
  };
  recent_predictions: RecentPrediction[];
}

export interface CompensationBreakdown {
  base_salary: string;
  bonus: string;
  signing_bonus: string;
  total_stocks: string;
  ctc: string;
  stocks_vesting: string;
  annual_base_numeric_lakhs?: number;
  annual_ctc_numeric_lakhs?: number;
  raw_extracted?: string;
}

export interface MarketSalaryBenchmark {
  benchmark_role: string;
  median_base_lakhs: number;
  median_ctc_lakhs: number;
  median_bonus_lakhs: number;
  median_base_display: string;
  median_ctc_display: string;
  median_bonus_display: string;
  salary_gap_percent: number;
  is_below_market: boolean;
  salary_anomaly_detected: boolean;
  anomaly_severity: 'CRITICAL' | 'MODERATE' | 'NORMAL';
  anomaly_reason: string;
}

export interface OfferScanResponse {
  verdict: 'GENUINE' | 'SUSPICIOUS' | 'HIGH_RISK_FRAUD' | 'SCANNED_DOCUMENT_REVIEW';
  binary_verdict?: 'REAL' | 'FAKE';
  status_label: string;
  legitimacy_score: number; // 0 - 100
  risk_score: number;
  is_scanned_image?: boolean;
  is_photo?: boolean;
  image_meta?: {
    format?: string;
    width?: number;
    height?: number;
    mode?: string;
  };
  extracted_details: {
    company_name: string;
    job_title: string;
    location?: string;
    offer_date?: string;
    emails: string[];
    cin: string;
    salary: string;
    char_count: number;
    file_size_kb?: number;
    page_count?: number;
    producer?: string;
    image_dimensions?: string;
  };
  compensation?: CompensationBreakdown;
  market_benchmark?: MarketSalaryBenchmark;
  ai_offer_insights?: string[];
  red_flags: string[];
  green_flags: string[];
  recommendations: string[];
  raw_text_preview?: string;
  filename?: string;
  scanned_at?: string;
}

export interface JobMatchAnalysis {
  match_score: number;
  fit_verdict: 'HIGH_FIT' | 'MODERATE_FIT' | 'LOW_FIT' | string;
  fit_label: string;
  matched_skills: string[];
  missing_skills: string[];
  total_job_skills_found: number;
  matched_count: number;
  missing_count: number;
}

export interface RoleMatchAnalysis {
  target_role: string;
  role_match_score: number;
  role_fit_label: string;
  matched_role_skills: string[];
  missing_role_skills: string[];
  role_recommendations: string[];
  key_points_to_add: string[];
}

export interface CompanyMatchAnalysis {
  target_company: string;
  company_match_score: number;
  shortlist_probability: 'HIGH' | 'MODERATE' | 'LOW' | string;
  shortlist_label: string;
  company_focus: string;
  culture_fit_notes: string[];
  shortlisting_key_points: string[];
}

export interface ResumeScoreResponse {
  overall_score: number;
  grade: string;
  readiness_status: 'READY' | 'NEEDS_IMPROVEMENT';
  readiness_verdict: string;
  job_match?: JobMatchAnalysis;
  role_match?: RoleMatchAnalysis;
  company_match?: CompanyMatchAnalysis;
  key_points_to_shortlist?: string[];
  word_count: number;
  metrics_count: number;
  action_verbs_count: number;
  section_scores: {
    sections_coverage: number;
    action_verbs: number;
    quantifiable_impact: number;
    technical_keywords: number;
    length_formatting: number;
  };
  sections_found: string[];
  sections_missing: string[];
  skills: string[];
  privacy_score: number;
  privacy_alerts: string[];
  strengths: string[];
  improvements: string[];
  candidate: {
    name: string;
    email: string;
    phone: string;
  };
  target_role?: string;
  target_company?: string;
  filename?: string;
  scanned_at?: string;
}

export interface JobUrlFetchResponse {
  url: string;
  company_name: string;
  title: string;
  description: string;
  email?: string;
  website?: string;
  cin?: string;
  mca_verified?: boolean;
  platform?: string;
  status: string;
}

export interface ScamRecord {
  id: string;
  company_name: string;
  job_title: string;
  scam_type: string;
  description: string;
  contact_info: string;
  demanded_amount: string;
  reported_by: string;
  date: string;
  votes: number;
  verified_fraud: boolean;
}

export interface ScamsResponse {
  total: number;
  scams: ScamRecord[];
}

export interface ReportScamRequest {
  company_name: string;
  job_title?: string;
  scam_type: string;
  description: string;
  contact_info?: string;
  demanded_amount?: string;
  reported_by?: string;
}

// API Functions
export const predictJob = async (data: PredictionRequest): Promise<PredictionResponse> => {
  const response = await api.post('/predict', data);
  return response.data;
};

export const scanOfferLetter = async (input: File | string, ocrText?: string): Promise<OfferScanResponse> => {
  if (typeof input === 'string') {
    const response = await api.post('/api/scan-offer-letter', { text: input });
    return response.data;
  } else {
    const formData = new FormData();
    formData.append('file', input);
    if (ocrText && ocrText.trim()) {
      formData.append('ocr_text', ocrText.trim());
    }
    const response = await api.post('/api/scan-offer-letter', formData);
    return response.data;
  }
};

export const scoreResume = async (
  input: File | string,
  targetRole: string = '',
  targetCompany: string = '',
  jobDescription: string = ''
): Promise<ResumeScoreResponse> => {
  if (typeof input === 'string') {
    const response = await api.post('/api/score-resume', {
      text: input,
      target_role: targetRole,
      target_company: targetCompany,
      job_description: jobDescription
    });
    return response.data;
  } else {
    const formData = new FormData();
    formData.append('file', input);
    if (targetRole) {
      formData.append('target_role', targetRole);
    }
    if (targetCompany) {
      formData.append('target_company', targetCompany);
    }
    if (jobDescription) {
      formData.append('job_description', jobDescription);
    }
    const response = await api.post('/api/score-resume', formData);
    return response.data;
  }
};

export const fetchJobUrl = async (url: string): Promise<JobUrlFetchResponse> => {
  const response = await api.post('/api/fetch-job-url', { url });
  return response.data;
};

export const getScams = async (params?: { q?: string; category?: string }): Promise<ScamsResponse> => {
  const response = await api.get('/api/scams', { params });
  return response.data;
};

export const reportScam = async (data: ReportScamRequest): Promise<{ message: string; scam: ScamRecord }> => {
  const response = await api.post('/api/scams/report', data);
  return response.data;
};

export const voteScam = async (scamId: string): Promise<{ message: string; votes: number }> => {
  const response = await api.post(`/api/scams/${scamId}/vote`);
  return response.data;
};

export const registerUser = async (data: RegisterRequest): Promise<{ message: string }> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const loginUser = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const loginWithGoogle = async (data: GoogleAuthRequest): Promise<AuthResponse> => {
  const response = await api.post('/auth/google', data);
  return response.data;
};

export const sendOtp = async (params: string | SendOtpRequest): Promise<SendOtpResponse> => {
  const payload = typeof params === 'string' ? { identifier: params, method: 'email' } : params;
  const response = await api.post('/auth/send-otp', payload);
  return response.data;
};

export const verifyOtpReset = async (data: VerifyOtpResetRequest): Promise<{ message: string }> => {
  const response = await api.post('/auth/verify-otp-reset', data);
  return response.data;
};

export const resetPassword = async (data: ResetPasswordRequest): Promise<{ message: string }> => {
  const response = await api.post('/auth/verify-otp-reset', data);
  return response.data;
};

export const getAnalytics = async (token: string): Promise<AnalyticsData> => {
  const response = await api.get('/admin/analytics', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getMe = async (token: string): Promise<AuthResponse['user']> => {
  const response = await api.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getVisitorCount = async (token?: string): Promise<number> => {
  try {
    const headers: Record<string, string> = {};
    const effectiveToken = token || localStorage.getItem('token');
    if (effectiveToken) {
      headers['Authorization'] = `Bearer ${effectiveToken}`;
    }
    const response = await api.post('/api/visitors', {}, { headers });
    return response.data.visitor_count;
  } catch {
    return 0;
  }
};

export interface SafeCompany {
  cin: string;
  company_name: string;
  state: string;
  status: string;
  is_safe: boolean;
  verified_mca: boolean;
  badge: string;
}

export interface SafeCompanySearchResponse {
  total_matches: number;
  query: string;
  state_filter: string;
  companies: SafeCompany[];
}

export interface SafeCompanyStatsResponse {
  total_verified_companies: number;
  region: string;
  state_breakdown: Record<string, number>;
  mca_verified: boolean;
}

export const searchSafeCompanies = async (
  q: string = '',
  state: string = 'All',
  status: string = 'Active',
  limit: number = 24
): Promise<SafeCompanySearchResponse> => {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (state && state !== 'All') params.append('state', state);
  if (status && status !== 'All') params.append('status', status);
  params.append('limit', limit.toString());

  const response = await api.get(`/api/companies/search?${params.toString()}`);
  return response.data;
};

export const getCompanyStats = async (): Promise<SafeCompanyStatsResponse> => {
  const response = await api.get('/api/companies/stats');
  return response.data;
};

export default api;
