import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            <h3 className="text-lg font-bold text-slate-100">Terms of Service & Advisory Disclaimer</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl font-bold p-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          <div className="p-3.5 bg-amber-950/30 border border-amber-500/20 rounded-xl text-amber-300">
            <strong>Advisory Notice:</strong> SAFE HIRE provides automated heuristic and machine-learning risk indicators for advisory guidance. It does not constitute formal legal counsel.
          </div>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-100 text-sm">1. Fair Use Policy</h4>
            <p className="text-slate-400 text-xs">
              SAFE HIRE is free for students, job applicants, and recruiters. Automated bots, script spamming, or attempting to bypass rate limits using proxy rotation is strictly prohibited.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-100 text-sm">2. Verification Accuracy & Sources</h4>
            <p className="text-slate-400 text-xs">
              MCA CIN verification relies on public Ministry of Corporate Affairs data and regional registry records. While our models operate with over 98% empirical accuracy, candidates are always encouraged to cross-check directly with verified company HR teams before committing to job offers.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-100 text-sm">3. Reporting Scam Syndicates</h4>
            <p className="text-slate-400 text-xs">
              Information submitted to the Community Scam Alert Board must reflect genuine fraud incidents. In case of financial extortion, candidates are strongly urged to file official reports with the Indian Cyber Crime Reporting Portal (<a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="text-cyan-400 underline">cybercrime.gov.in</a>).
            </p>
          </section>
        </div>

        <div className="pt-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs tracking-wide transition-all shadow-md"
          >
            Agree & Close
          </button>
        </div>
      </div>
    </div>
  );
};
