import React, { useState } from 'react';
import { AuthResponse, getMe, getVisitorCount } from './services/api';
import AuthForm from './components/AuthForm';
import VerificationForm from './components/VerificationForm';
import { OfferLetterScanner } from './components/OfferLetterScanner';
import { SafeCompanyExplorer } from './components/SafeCompanyExplorer';
import { CommunityScamBoard } from './components/CommunityScamBoard';
import AdminDashboard from './components/AdminDashboard';
import { CookieBanner } from './components/CookieBanner';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { TermsModal } from './components/TermsModal';
import { NotFound } from './components/NotFound';
import { Footer } from './components/Footer';
import shieldLogo from './assets/safe-hire-shield.png';

function App() {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'verify' | 'offer-scan' | 'safe-companies' | 'scam-board'>('verify');
  const [selectedSafeCompany, setSelectedSafeCompany] = useState<{ company_name: string; cin?: string } | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [visitorCount, setVisitorCount] = useState(0);

  const handleAuthSuccess = (userData: AuthResponse) => {
    setUser(userData);
    localStorage.setItem('token', userData.access_token);
  };

  const handleLogout = () => {
    setUser(null);
    setShowAdmin(false);
    setIsNotFound(false);
    localStorage.removeItem('token');
  };

  const toggleAdminView = () => {
    setIsNotFound(false);
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
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-x-hidden">
        <AuthForm onAuthSuccess={handleAuthSuccess} />
        <Footer
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onOpenTerms={() => setIsTermsOpen(true)}
        />
        <CookieBanner />
        <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
        <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      </div>
    );
  }

  const isAdmin = user.user.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden flex flex-col justify-between">
      {/* Ambient background glow effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div>
        {/* Sleek Floating Glass Navbar */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/80 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div 
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => { setIsNotFound(false); setShowAdmin(false); setActiveTab('verify'); }}
              >
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
                    AI Core v2.2
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
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition duration-200 border flex items-center gap-1.5 ${
                      showAdmin
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAdmin ? "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" : "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"} />
                    </svg>
                    <span>{showAdmin ? 'Verification Panel' : 'Admin Analytics'}</span>
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
                  className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition flex items-center gap-1.5"
                  title="Sign Out"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>

            {/* Secondary Sub-Navbar Tabs (Only in user view) */}
            {!showAdmin && !isNotFound && (
              <div className="flex items-center gap-2 border-t border-slate-800/60 py-2.5 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => { setIsNotFound(false); setActiveTab('verify'); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'verify'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Job Legitimacy Verification</span>
                </button>

                <button
                  onClick={() => { setIsNotFound(false); setActiveTab('offer-scan'); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'offer-scan'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Offer Letter PDF Scanner</span>
                </button>

                <button
                  onClick={() => { setIsNotFound(false); setActiveTab('safe-companies'); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'safe-companies'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Verified Safe Companies (7.99L MCA)</span>
                </button>

                <button
                  onClick={() => { setIsNotFound(false); setActiveTab('scam-board'); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'scam-board'
                      ? 'bg-gradient-to-r from-rose-500 to-orange-600 text-white shadow-md shadow-rose-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Community Scam Board</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main App Content */}
        <main className="relative py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
          {isNotFound ? (
            <NotFound onBackToHome={() => setIsNotFound(false)} />
          ) : showAdmin && isAdmin ? (
            <AdminDashboard token={user.access_token} />
          ) : activeTab === 'offer-scan' ? (
            <OfferLetterScanner />
          ) : activeTab === 'safe-companies' ? (
            <SafeCompanyExplorer
              onSelectCompany={(compName, cin) => {
                setSelectedSafeCompany({ company_name: compName, cin });
                setActiveTab('verify');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : activeTab === 'scam-board' ? (
            <CommunityScamBoard
              onExploreSafe={() => {
                setActiveTab('safe-companies');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : (
            <VerificationForm initialData={selectedSafeCompany} />
          )}
        </main>
      </div>

      {/* Global Modern Footer */}
      <Footer
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenTerms={() => setIsTermsOpen(true)}
        onSelectTab={(tab) => {
          setIsNotFound(false);
          setShowAdmin(false);
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onTrigger404={() => {
          setIsNotFound(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Global Modals & Banner */}
      <CookieBanner />
      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
}

export default App;
