import React from 'react';
import shieldLogo from '../assets/safe-hire-shield.png';

interface Props {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onSelectTab?: (tab: 'verify' | 'offer-scan' | 'safe-companies') => void;
  onTrigger404?: () => void;
}

export const Footer: React.FC<Props> = ({
  onOpenPrivacy,
  onOpenTerms,
  onSelectTab,
  onTrigger404,
}) => {
  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-xl text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand & Contact info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2.5 h-5">
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-sm shadow-cyan-500/20 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-slate-900 rounded-sm flex items-center justify-center p-0.5">
                  <img src={shieldLogo} alt="SAFE HIRE" className="w-full h-full object-contain" />
                </div>
              </div>
              <span className="text-sm font-black tracking-tight text-white leading-none">
                SAFE HIRE
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India&apos;s pioneering AI-powered recruitment security and offer letter fraud defense engine. Protects jobseekers with MCA real-time validation, NLP heuristics, and 8 Lakh+ South Indian registered companies registry.
            </p>
            <div className="space-y-1 text-xs text-slate-400">
              <p className="text-slate-300 font-semibold font-sans">Security Response HQ:</p>
              <p>📍 OMR Cyber Corridor, Chennai, TN, India</p>
              <p>📧 contact@safehire.ai | support@safehire.ai</p>
            </div>
          </div>

          {/* Col 2: Core Defense Tools */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-cyan-400">
              Security Engines
            </h2>
            <ul className="space-y-2 text-xs">
              {onSelectTab ? (
                <>
                  <li>
                    <a
                      href="#verify"
                      role="button"
                      onClick={(e) => { e.preventDefault(); onSelectTab('verify'); }}
                      className="text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded-lg"
                    >
                      <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Job Legitimacy Verification</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#offer-scan"
                      role="button"
                      onClick={(e) => { e.preventDefault(); onSelectTab('offer-scan'); }}
                      className="text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded-lg"
                    >
                      <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Forensic Offer Letter Scanner</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#safe-companies"
                      role="button"
                      onClick={(e) => { e.preventDefault(); onSelectTab('safe-companies'); }}
                      className="text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/50 rounded-lg"
                    >
                      <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>Verified Safe Companies (7.99L MCA)</span>
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li className="text-slate-400 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Job Legitimacy Verification</span>
                  </li>
                  <li className="text-slate-400 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Forensic Offer Letter Scanner</span>
                  </li>
                  <li className="text-slate-400 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Verified Safe Companies Directory</span>
                  </li>
                </>
              )}
              {onTrigger404 && (
                <li>
                  <button
                    onClick={onTrigger404}
                    className="text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1.5 text-xs font-mono"
                  >
                    <svg className="w-3 h-3 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Test 404 Route Screen</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Official Portals & Helplines */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-cyan-400">
              National Helplines
            </h2>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded-lg"
                >
                  <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span>National Cyber Crime Portal</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.mca.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded-lg"
                >
                  <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  <span>Ministry of Corporate Affairs (MCA)</span>
                </a>
              </li>
              <li className="pt-1">
                <div className="p-2.5 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-lg text-xs transition-colors">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                    <svg className="w-3.5 h-3.5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Emergency Cyber Helpline</span>
                  </div>
                  <p className="font-sans font-bold text-rose-400 text-xs mt-1 pl-5 flex items-center gap-1.5">
                    <span>Dial 1930</span>
                    <span className="text-slate-500 font-normal">• Toll-free India</span>
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Compliance */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-cyan-400">
              Legal & Compliance
            </h2>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="#privacy"
                  role="button"
                  onClick={(e) => { e.preventDefault(); onOpenPrivacy(); }}
                  className="text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded-lg text-left"
                >
                  <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Privacy Policy (Zero Data Retention)</span>
                </a>
              </li>
              <li>
                <a
                  href="#terms"
                  role="button"
                  onClick={(e) => { e.preventDefault(); onOpenTerms(); }}
                  className="text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded-lg text-left"
                >
                  <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  <span>Terms of Service & AI Advisory</span>
                </a>
              </li>
              <li className="text-xs text-slate-400 leading-relaxed pt-1">
                Compliant with India DPDP Act 2023. Real-time document scans are executed in volatile memory and purged immediately.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SAFE HIRE Defense Grid. All Rights Reserved.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400 font-mono">All Security Cores Active • Zero Retention Grid</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

