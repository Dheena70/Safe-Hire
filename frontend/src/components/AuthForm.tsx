import React, { useState } from 'react';
import { registerUser, loginUser, RegisterRequest, LoginRequest, AuthResponse, describeApiError } from '../services/api';
import bgImage from '../assets/safe-hire-bg.png';

interface AuthFormProps {
  onAuthSuccess: (userData: AuthResponse) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<RegisterRequest>({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      if (isLogin) {
        const loginData = formData as LoginRequest;
        const response = await loginUser(loginData);
        onAuthSuccess(response);
      } else {
        const registerData = formData as RegisterRequest;
        await registerUser(registerData);
        setIsLogin(true);
        setNotice('Registration successful! Please sign in with your credentials.');
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
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-cyan-500/20 mb-4 items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-2xl">
                🛡️
              </div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              SAFE HIRE
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              AI-Powered Company & Recruitment Fraud Defense
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 border border-slate-800 rounded-xl mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`py-2 rounded-lg transition duration-200 ${
                isLogin
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`py-2 rounded-lg transition duration-200 ${
                !isLogin
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm">
                    👤
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-sm transition"
                    placeholder="e.g., Alex Johnson"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm">
                  ✉️
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-sm transition"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm">
                  🔒
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-sm transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

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
                isLogin ? 'Sign In to Portal' : 'Create Free Account'
              )}
            </button>
          </form>

          {/* Security Features Footnote */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center space-x-1">
              <span>🔒 256-Bit Encrypted Session</span>
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
