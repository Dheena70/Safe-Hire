import React, { useState } from 'react';
import { AuthResponse, getMe, getVisitorCount } from './services/api';
import AuthForm from './components/AuthForm';
import VerificationForm from './components/VerificationForm';
import AdminDashboard from './components/AdminDashboard';
import shieldLogo from './assets/safe-hire-shield.png';

function App() {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [visitorCount, setVisitorCount] = useState(0);

  const handleAuthSuccess = (userData: AuthResponse) => {
    setUser(userData);
    localStorage.setItem('token', userData.access_token);
  };

  const handleLogout = () => {
    setUser(null);
    setShowAdmin(false);
    localStorage.removeItem('token');
  };

  const toggleAdminView = () => {
    setShowAdmin(!showAdmin);
  };

  // Restore session from token on startup
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCheckingSession(false);
      return;
    }

    getMe(token)
      .then((me) => {
        setUser({ access_token: token, user: me });
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setCheckingSession(false));
  }, []);

  // Fetch visitor count on startup
  React.useEffect(() => {
    getVisitorCount().then((count) => setVisitorCount(count));
  }, []);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center mb-4">
          <div className="absolute w-20 h-20 bg-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-400 font-medium tracking-wide text-sm">Initializing SAFE HIRE Security Core...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  const isAdmin = user.user.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden">
      {/* Ambient background glow effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Sleek Floating Glass Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center p-1">
                  <img src={shieldLogo} alt="SAFE HIRE" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                  SAFE HIRE
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full">
                  AI Core v2.0
                </span>
              </div>

              {/* Live Visitor Capsule */}
              <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-slate-800/60 border border-slate-700/60 rounded-full text-xs text-slate-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Live Verifications:</span>
                <span className="font-bold text-cyan-400 font-mono">{visitorCount.toLocaleString()}</span>
              </div>
            </div>

            {/* User & Actions */}
            <div className="flex items-center space-x-3">
              {isAdmin && (
                <button
                  onClick={toggleAdminView}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition duration-200 border ${
                    showAdmin
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700 hover:border-slate-600'
                  }`}
                >
                  {showAdmin ? '🔍 Verification Panel' : '📊 Admin Analytics'}
                </button>
              )}

              {/* User Avatar Chip */}
              <div className="flex items-center space-x-2 bg-slate-800/50 border border-slate-700/50 py-1 px-3 rounded-full">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-slate-950">
                  {user.user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-slate-200 max-w-[100px] truncate sm:max-w-none">
                  {user.user.name}
                </span>
                {isAdmin && (
                  <span className="text-[9px] uppercase font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                    Admin
                  </span>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition"
                title="Sign Out"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">🚪</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main App Content */}
      <main className="relative">
        {showAdmin && isAdmin ? (
          <AdminDashboard token={user.access_token} />
        ) : (
          <VerificationForm />
        )}
      </main>
    </div>
  );
}

export default App;
