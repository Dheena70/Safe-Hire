import React from 'react';
import shieldLogo from '../assets/safe-hire-shield.png';

interface Props {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onSelectTab?: (tab: 'verify' | 'offer-scan' | 'scam-board') => void;
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
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-md shadow-cyan-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-900 rounded-[6px] flex items-center justify-center p-0.5">
                  <img src={shieldLogo} alt="SAFE HIRE" className="w-full h-full object-contain" />
                </div>
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                SAFE HIRE
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India&apos;s pioneering AI-powered recruitment security and offer letter fraud defense engine. Protects jobseekers with MCA real-time validation, NLP heuristics, and scam community intelligence.
            </p>
            <div className="space-y-1 text-xs text-slate-400 font-mono">
              <p className="text-slate-300 font-semibold font-sans">Security Response HQ:</p>
              <p>📍 OMR Cyber Corridor, Chennai, TN, India</p>
              <p>📧 contact@safehire.ai | support@safehire.ai</p>
            </div>
          </div>

          {/* Col 2: Core Defense Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono">
              Security Engines
            </h4>
            <ul className="space-y-2 text-xs">
              {onSelectTab ? (
                <>
                  <li>
                    <button
                      onClick={() => onSelectTab('verify')}
                      className="hover:text-cyan-400 transition text-left"
                    >
                      🎯 Job Legitimacy Verification
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onSelectTab('offer-scan')}
                      className="hover:text-cyan-400 transition text-left"
                    >
                      📄 Forensic Offer Letter Scanner
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onSelectTab('scam-board')}
                      className="hover:text-rose-400 transition text-left"
                    >
                      🚨 Live Community Scam Alert Board
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="text-slate-400">🎯 Job Legitimacy Verification</li>
                  <li className="text-slate-400">📄 Forensic Offer Letter Scanner</li>
                  <li className="text-slate-400">🚨 Live Community Scam Board</li>
                </>
              )}
              {onTrigger404 && (
                <li>
                  <button
                    onClick={onTrigger404}
                    className="text-slate-500 hover:text-slate-300 transition text-[11px] font-mono"
                  >
                    ⚡ Test 404 Route Screen
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Official Portals & Helplines */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono">
              National Helplines
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-cyan-400 transition flex items-center gap-1.5"
                >
                  <span>🌐</span>
                  <span>National Cyber Crime Portal</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.mca.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-cyan-400 transition flex items-center gap-1.5"
                >
                  <span>🏛️</span>
                  <span>Ministry of Corporate Affairs (MCA)</span>
                </a>
              </li>
              <li className="pt-1">
                <div className="p-2.5 bg-rose-950/20 border border-rose-500/20 rounded-lg text-rose-300 text-[11px]">
                  <p className="font-bold">🚨 Emergency Cyber Helpline:</p>
                  <p className="font-mono font-bold text-rose-400 text-sm mt-0.5">Dial 1930</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono">
              Legal & Compliance
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onOpenPrivacy}
                  className="hover:text-cyan-400 transition text-left flex items-center gap-1.5"
                >
                  <span>🔒</span>
                  <span>Privacy Policy (Zero Data Retention)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTerms}
                  className="hover:text-cyan-400 transition text-left flex items-center gap-1.5"
                >
                  <span>⚖️</span>
                  <span>Terms of Service & AI Advisory</span>
                </button>
              </li>
              <li className="text-[11px] text-slate-500 leading-normal pt-1">
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
