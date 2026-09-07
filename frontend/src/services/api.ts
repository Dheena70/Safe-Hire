import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
    return 'The server took too long to respond. Is the backend running?';
  }
  if (err?.request) {
    return `Could not reach the server at ${API_BASE_URL}. Make sure the backend is running on port 5050.`;
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
  };
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

export interface OfferScanResponse {
  verdict: 'GENUINE' | 'SUSPICIOUS' | 'HIGH_RISK_FRAUD';
  status_label: string;
  legitimacy_score: number; // 0 - 100
  risk_score: number;
  extracted_details: {
    company_name: string;
    job_title: string;
    emails: string[];
    cin: string;
    salary: string;
    char_count: number;
  };
  red_flags: string[];
  green_flags: string[];
  recommendations: string[];
  raw_text_preview?: string;
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

export const scanOfferLetter = async (input: File | string): Promise<OfferScanResponse> => {
  if (typeof input === 'string') {
    const response = await api.post('/api/scan-offer-letter', { text: input });
    return response.data;
  } else {
    const formData = new FormData();
    formData.append('file', input);
    const response = await api.post('/api/scan-offer-letter', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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

export default api;
