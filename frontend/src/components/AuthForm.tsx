import React, { useState, useEffect } from 'react';
import { 
  registerUser, 
  loginUser, 
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
type OtpMethod = 'email' | 'phone';

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [otpStep, setOtpStep] = useState<OtpStep>('request_otp');
  const [otpMethod, setOtpMethod] = useState<OtpMethod>('email');
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
    const identifier = otpMethod === 'email' ? formData.email.trim() : formData.phone.trim();
    if (!identifier) {
      setError(otpMethod === 'email' ? 'Please enter your registered Email Address.' : 'Please enter your registered Phone Number.');
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const res = await sendOtp({
        identifier: identifier,
        method: otpMethod
      });
      setOtpStep('verify_otp');
      setOtpCountdown(120);
      setNotice(res.message || `A 6-digit OTP code has been dispatched to your ${otpMethod === 'email' ? 'Email' : 'Mobile Phone'}.`);
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
          const identifier = otpMethod === 'email' ? formData.email.trim() : formData.phone.trim();
          const verifyData: VerifyOtpResetRequest = {
            identifier: identifier,
            email: formData.email,
            phone: formData.phone,
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
        <div className="backdrop-blur-2xl bg-slate-900/90 border border-slate-700/60 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-cyan-950/30">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-cyan-500/20 mb-4 items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center p-2">
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
            <div className="grid grid-cols-2 p-1 bg-slate-950/80 border border-slate-800 rounded-xl mb-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError(null); setNotice(null); }}
                className={`py-2 rounded-lg transition duration-200 ${
                  authMode === 'login'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setError(null); setNotice(null); }}
                className={`py-2 rounded-lg transition duration-200 ${
                  authMode === 'register'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          ) : (
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-white flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>2-Step OTP Password Reset</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {otpStep === 'request_otp' 
                  ? 'Choose verification method and receive your 6-digit security code.'
                  : `Enter the 6-digit OTP code sent to your ${otpMethod === 'email' ? 'Email' : 'Phone'} and set a new password.`}
              </p>
            </div>
          )}

          {/* OTP Method Selector (Email vs Phone) */}
          {authMode === 'forgot' && otpStep === 'request_otp' && (
            <div className="grid grid-cols-2 p-1 bg-slate-950/80 border border-cyan-500/30 rounded-xl mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setOtpMethod('email'); setError(null); }}
                className={`py-2 rounded-lg flex items-center justify-center space-x-2 transition ${
                  otpMethod === 'email'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Email Address</span>
              </button>
              <button
                type="button"
                onClick={() => { setOtpMethod('phone'); setError(null); }}
                className={`py-2 rounded-lg flex items-center justify-center space-x-2 transition ${
                  otpMethod === 'phone'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Phone Number</span>
              </button>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {authMode === 'register' && (
              <>
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
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
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-sm transition"
                      placeholder="e.g., Alex Johnson"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
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
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-sm transition"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Field (when in login, register, or forgot with email method) */}
            {(authMode !== 'forgot' || (authMode === 'forgot' && otpMethod === 'email')) && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
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
                    required={authMode !== 'forgot' || (authMode === 'forgot' && otpMethod === 'email')}
                    disabled={authMode === 'forgot' && otpStep === 'verify_otp'}
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-sm transition disabled:opacity-60"
                    placeholder="name@example.com"
                  />
                </div>
              </div>
            )}

            {/* Phone Field (when in forgot with phone method) */}
            {authMode === 'forgot' && otpMethod === 'phone' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Registered Phone Number
                  </label>
                  {otpStep === 'verify_otp' && (
                    <button
                      type="button"
                      onClick={() => { setOtpStep('request_otp'); setError(null); setNotice(null); }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition"
                    >
                      Change Number
                    </button>
                  )}
                </div>
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
                    required={otpMethod === 'phone'}
                    disabled={otpStep === 'verify_otp'}
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-sm transition disabled:opacity-60"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            )}

            {/* OTP Input in Verify Step */}
            {authMode === 'forgot' && otpStep === 'verify_otp' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="otp" className="block text-xs font-semibold uppercase tracking-wider text-cyan-400">
                      6-Digit Verification Code (OTP)
                    </label>
                    {otpCountdown > 0 ? (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
                        ⏱️ {formatTimer(otpCountdown)}
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold">
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
                    className="w-full px-4 py-2.5 bg-slate-950/70 border border-cyan-500/60 rounded-xl text-white font-mono tracking-[0.4em] text-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition text-center"
                  />
                </div>
              </div>
            )}

            {/* Password input (for login, register, or verify_otp) */}
            {(authMode !== 'forgot' || otpStep === 'verify_otp') && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-sm transition"
                    placeholder="At least 8 characters"
                  />
                </div>
              </div>
            )}

            {/* Confirm Password in Register & Verify OTP */}
            {(authMode === 'register' || (authMode === 'forgot' && otpStep === 'verify_otp')) && (
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-sm transition"
                    placeholder={authMode === 'forgot' ? 'Repeat new password' : 'Repeat password'}
                  />
                </div>
              </div>
            )}

            {notice && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300">
                {notice}
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition duration-300 shadow-lg shadow-cyan-500/20 flex items-center justify-center text-sm tracking-wide mt-2"
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
                  ? `Send 6-Digit OTP Code via ${otpMethod === 'email' ? 'Email' : 'SMS'}`
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
                  ← Back to Sign In
                </button>
              </div>
            )}
          </form>

          {/* Security Features Footnote */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center space-x-2">
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
    </div>
  );
};

export default AuthForm;




