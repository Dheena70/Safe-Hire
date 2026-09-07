import React, { useState, useEffect } from 'react';

export const CookieBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    const consent = localStorage.getItem('safehire_cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('safehire_cookie_consent', 'accepted');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-8 md:right-auto md:max-w-md z-50 animate-fadeIn">
      <div className="backdrop-blur-xl bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 shadow-2xl shadow-cyan-950/40 text-slate-200 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🍪</span>
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Cookie & Security Storage Notice
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              We use essential encrypted session storage and security tokens to maintain your verified session and protect against brute-force attacks. No tracking telemetry is sold.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleAccept}
            className="flex-1 py-2 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 transition-all text-center"
          >
            Accept Security Storage
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="py-2 px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
