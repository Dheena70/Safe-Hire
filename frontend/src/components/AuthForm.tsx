import React, { useState, useEffect } from 'react';
import { 
  registerUser, 
  loginUser, 
  loginWithGoogle,
  sendOtp, 
  verifyOtpReset, 
  RegisterRequest, 
  LoginRequest, 
  VerifyOtpResetRequest, 
  AuthResponse, 
  describeApiError 
} from '../services/api';
import bgImage from '../assets/safe-hire-bg.png';
import shieldLogo from '../assets/safe-hire-shield.png';

interface AuthFormProps {
  onAuthSuccess: (userData: AuthResponse) => void;
}

type AuthMode = 'login' | 'register' | 'forgot';
type OtpStep = 'request_otp' | 'verify_otp';

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [otpStep, setOtpStep] = useState<OtpStep>('request_otp');
  const [otpCountdown, setOtpCountdown] = useState<number>(120);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    otp: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [demoGoogleEmail, setDemoGoogleEmail] = useState('rdheena0509@gmail.com');
  const [demoGoogleName, setDemoGoogleName] = useState('Dheena');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    if (authMode === 'forgot' && otpStep === 'verify_otp' && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [authMode, otpStep, otpCountdown]);

  // Initialize Google Identity Services if client ID is configured
  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const setupGsi = () => {
      const g = (window as any).google;
      if (g?.accounts?.id) {
        try {
          g.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: any) => {
              if (response?.credential) {
                setGoogleLoading(true);
                setError(null);
                setNotice(null);
                try {
                  const authRes = await loginWithGoogle({ credential: response.credential });
                  onAuthSuccess(authRes);
                } catch (err: any) {
                  setError(describeApiError(err));
                } finally {
                  setGoogleLoading(false);
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } catch (e) {
          console.warn('Google Identity Services notice:', e);
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      setupGsi();
    } else {
      const timer = setTimeout(setupGsi, 1200);
      return () => clearTimeout(timer);
    }
  }, [onAuthSuccess]);

  const handleGoogleSignIn = () => {
    setError(null);
    setNotice(null);
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const g = (window as any).google;

    if (clientId && g?.accounts?.id) {
      try {
        g.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            if (g?.accounts?.oauth2) {
              const client = g.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'email profile openid',
                callback: async (tokenResp: any) => {
                  if (tokenResp?.access_token) {
                    setGoogleLoading(true);
                    try {
                      const authRes = await loginWithGoogle({ access_token: tokenResp.access_token });
                      onAuthSuccess(authRes);
                    } catch (err: any) {
                      setError(describeApiError(err));
                    } finally {
                      setGoogleLoading(false);
                    }
                  }
                }
              });
              client.requestAccessToken();
            } else {
              setShowGoogleModal(true);
            }
          }
        });
      } catch (err) {
        setShowGoogleModal(true);
      }
    } else {
      setShowGoogleModal(true);
    }
  };

  const handleDemoGoogleSignIn = async () => {
    const email = demoGoogleEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid Google email address.');
      return;
    }
    setGoogleLoading(true);
    setError(null);
    try {
      const authRes = await loginWithGoogle({
        email,
        name: demoGoogleName.trim() || email.split('@')[0],
        google_id: `g_oauth_${Date.now()}`
      });
      setShowGoogleModal(false);
      onAuthSuccess(authRes);
    } catch (err: any) {
      setError(describeApiError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const email = formData.email.trim();
    if (!email) {
      setError('Please enter your registered Email Address.');
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const res = await sendOtp({
        identifier: email,
        method: 'email'
      });
      setOtpStep('verify_otp');
      setOtpCountdown(120);
      setNotice(res.message || 'A 6-digit OTP verification code has been dispatched to your Email.');
    } catch (err: any) {
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      if (authMode === 'login') {
        const loginData: LoginRequest = {
          email: formData.email,
          password: formData.password,
        };
        const response = await loginUser(loginData);
        onAuthSuccess(response);
      } else if (authMode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match. Please make sure both passwords match.');
          setLoading(false);
          return;
        }
        const registerData: RegisterRequest = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        };
        await registerUser(registerData);
        setAuthMode('login');
        setNotice('Registration successful! Please sign in with your credentials.');
      } else if (authMode === 'forgot') {
        if (otpStep === 'request_otp') {
          await handleSendOtp();
        } else {
          if (!formData.otp || formData.otp.trim().length !== 6) {
            setError('Please enter the 6-digit OTP verification code.');
            setLoading(false);
            return;
          }
          if (formData.password !== formData.confirmPassword) {
            setError('New password and confirmation password do not match.');
            setLoading(false);
            return;
          }
          const email = formData.email.trim();
          const verifyData: VerifyOtpResetRequest = {
            identifier: email,
            email: email,
            otp: formData.otp.trim(),
            new_password: formData.password,
          };
          const res = await verifyOtpReset(verifyData);
          setAuthMode('login');
          setOtpStep('request_otp');
          setNotice(res.message || 'Verification successful! Password updated. Please sign in.');
        }
      }
    } catch (err: any) {
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-950">
      {/* Background Graphic & Dark Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-25 pointer-events-none"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/95 to-slate-950 pointer-events-none" />

      {/* Ambient Neon Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Glass Card */}
        <div className="backdrop-blur-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl p-8 sm:p-10 shadow-2xl shadow-cyan-950/30">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-cyan-500/20 mb-4 items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center p-2">
                <img src={shieldLogo} alt="SAFE HIRE" className="w-full h-full object-contain" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              SAFE HIRE
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              AI-Powered Company & Recruitment Fraud Defense
            </p>
          </div>

          {/* Mode Tabs or Forgot Title */}
          {authMode !== 'forgot' ? (
            <div role="tablist" aria-label="Authentication Type" className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-700/80 rounded-lg mb-7 text-xs font-semibold gap-1">
              <button
                type="button"
                role="tab"
                aria-selected={authMode === 'login'}
                onClick={() => { setAuthMode('login'); setError(null); setNotice(null); }}
                className={`py-2 px-3 rounded-md transition-all duration-200 text-center font-semibold ${
                  authMode === 'login'
                    ? 'bg-slate-800 text-cyan-300 border border-slate-600 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={authMode === 'register'}
                onClick={() => { setAuthMode('register'); setError(null); setNotice(null); }}
                className={`py-2 px-3 rounded-md transition-all duration-200 text-center font-semibold ${
                  authMode === 'register'
                    ? 'bg-slate-800 text-cyan-300 border border-slate-600 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                Create Account
              </button>
            </div>
          ) : (
            <div className="text-center mb-7">
              <h2 className="text-lg font-bold text-white flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Email OTP Password Reset</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {otpStep === 'request_otp' 
                  ? 'Enter your registered email address to receive your 6-digit security code.'
                  : `Enter the 6-digit OTP code sent to ${formData.email} and set a new password.`}
              </p>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4 pt-1" onSubmit={handleSubmit}>
            {/* Continue with Google Option */}
            {authMode !== 'forgot' && (
              <div className="mb-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-cyan-950/30 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
                >
                  {googleLoading ? (
                    <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span className="text-slate-100 group-hover:text-cyan-200 transition">
                    {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
                  </span>
                </button>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="border-t border-slate-700/80 w-full" />
                  <span className="bg-slate-900 px-3 text-[11px] text-slate-400 uppercase tracking-wider font-semibold shrink-0">
                    Or continue with email
                  </span>
                  <div className="border-t border-slate-700/80 w-full" />
                </div>
              </div>
            )}

            {authMode === 'register' && (
              <>
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-600 hover:border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 text-sm transition"
                      placeholder="e.g., Alex Johnson"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mobile Phone Number <span className="text-slate-500 lowercase font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-600 hover:border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 text-sm transition"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="email" className="block text-xs font-semibold text-slate-300">
                  Email Address
                </label>
                {authMode === 'forgot' && otpStep === 'verify_otp' && (
                  <button
                    type="button"
                    onClick={() => { setOtpStep('request_otp'); setError(null); setNotice(null); }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition"
                  >
                    Change Email
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={authMode === 'forgot' && otpStep === 'verify_otp'}
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-600 hover:border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 text-sm transition disabled:opacity-60"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* OTP Input in Verify Step */}
            {authMode === 'forgot' && otpStep === 'verify_otp' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="otp" className="block text-xs font-semibold text-cyan-400">
                      6-Digit Verification Code (OTP)
                    </label>
                    {otpCountdown > 0 ? (
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold inline-flex items-center gap-1">
                        <svg className="w-3 h-3 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                          <polyline points="12 6 12 12 16 14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{formatTimer(otpCountdown)}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold">
                        Expired
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={loading}
                    className="text-xs text-slate-400 hover:text-cyan-300 underline transition"
                  >
                    Resend Code
                  </button>
                </div>
                <div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    maxLength={6}
                    required
                    value={formData.otp}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-950/90 border border-cyan-500/80 rounded-lg text-white font-mono tracking-[0.4em] text-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition text-center"
                  />
                </div>
              </div>
            )}

            {/* Password input (for login, register, or verify_otp) */}
            {(authMode !== 'forgot' || otpStep === 'verify_otp') && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-300">
                    {authMode === 'forgot' ? 'New Password' : 'Password'}
                  </label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setAuthMode('forgot'); setOtpStep('request_otp'); setError(null); setNotice(null); }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-600 hover:border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 text-sm transition"
                    placeholder="At least 8 characters"
                  />
                </div>
              </div>
            )}

            {/* Confirm Password in Register & Verify OTP */}
            {(authMode === 'register' || (authMode === 'forgot' && otpStep === 'verify_otp')) && (
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {authMode === 'forgot' ? 'Confirm New Password' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-600 hover:border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 text-sm transition"
                    placeholder={authMode === 'forgot' ? 'Repeat new password' : 'Repeat password'}
                  />
                </div>
              </div>
            )}

            {notice && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300">
                {notice}
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-lg transition duration-300 shadow-lg shadow-cyan-500/20 flex items-center justify-center text-sm tracking-wide mt-6 mb-2"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                authMode === 'login'
                  ? 'Sign In to Portal'
                  : authMode === 'register'
                  ? 'Create Free Account'
                  : otpStep === 'request_otp'
                  ? 'Send 6-Digit OTP to Email'
                  : 'Verify OTP & Set New Password'
              )}
            </button>

            {authMode === 'forgot' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setOtpStep('request_otp'); setError(null); setNotice(null); }}
                  className="text-xs text-slate-400 hover:text-cyan-400 transition"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Sign In</span>
                  </span>
                </button>
              </div>
            )}
          </form>

          {/* Security Features Footnote */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400 font-medium flex items-center justify-center space-x-2">
              <svg className="w-3.5 h-3.5 text-cyan-400 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>256-Bit Encrypted Session</span>
              <span>•</span>
              <span>MCA Verified</span>
            </p>
          </div>
        </div>
      </div>

      {/* Google Sign-In Quick Access & Setup Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-7 text-left overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center p-2 shadow-inner">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Continue with Google</h3>
                  <p className="text-xs text-slate-400">Fast 1-Click Authentication</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick Test / Demo Sign-In Section */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
                  Instant Google Sign-In Test
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                  Ready to test
                </span>
              </div>
              <p className="text-xs text-slate-300">
                You can immediately test signing in with your Google account email below:
              </p>
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Google Account Email
                  </label>
                  <input
                    type="email"
                    value={demoGoogleEmail}
                    onChange={(e) => setDemoGoogleEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-400 font-mono"
                    placeholder="rdheena0509@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={demoGoogleName}
                    onChange={(e) => setDemoGoogleName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-400"
                    placeholder="Dheena"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleDemoGoogleSignIn}
                disabled={googleLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs transition duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
                <span>Sign In as Verified Google User</span>
              </button>
            </div>

            {/* Production Instructions */}
            <div className="mt-4 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <svg className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-slate-300 mb-1">Production Google Cloud Setup:</p>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    To connect the live Google Cloud OAuth popup, create an OAuth 2.0 Web Client ID in Google Cloud Console and add it to your <code className="text-cyan-300 font-mono">frontend/.env</code> as:
                  </p>
                  <div className="mt-1.5 p-1.5 bg-slate-900 rounded font-mono text-[10px] text-cyan-300 select-all border border-slate-800">
                    REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthForm;




