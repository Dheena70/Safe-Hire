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
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    name: string;
    email: string;
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

// API Functions
export const predictJob = async (data: PredictionRequest): Promise<PredictionResponse> => {
  const response = await api.post('/predict', data);
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

export const getVisitorCount = async (): Promise<number> => {
  try {
    const response = await api.post('/api/visitors');
    return response.data.visitor_count;
  } catch {
    return 0;
  }
};

export default api;
