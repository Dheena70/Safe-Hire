import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔒</span>
            <h3 className="text-lg font-bold text-slate-100">Privacy Policy & Data Protection</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl font-bold p-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          <div className="p-3.5 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-cyan-300">
            <strong>Key Commitment:</strong> SAFE HIRE is built with a <em>Privacy-First</em> architecture. We never store or sell uploaded resumes, offer letters, or personal identifying information.
          </div>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-100 text-sm">1. Document & Offer Letter Processing</h4>
            <p className="text-slate-400 text-xs">
              When you upload an offer letter or paste appointment text for forensic analysis, the file is read in volatile memory (RAM) solely for the duration of the NLP and heuristic inspection. The raw document is immediately purged from memory once the audit score is generated.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-100 text-sm">2. Account Credentials & Cryptography</h4>
            <p className="text-slate-400 text-xs">
              All passwords are salt-hashed using one-way <strong>Bcrypt</strong> cryptography with high work factors. Verification tokens are signed using 256-bit high-entropy JWT secrets.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-100 text-sm">3. Rate Limiting & Anti-Abuse Telemetry</h4>
            <p className="text-slate-400 text-xs">
              Client IP addresses are temporarily logged in in-memory sliding-window caches to mitigate Distributed Denial-of-Service (DDoS) and brute-force password attacks. These records automatically expire every 60 seconds.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-100 text-sm">4. Compliance</h4>
            <p className="text-slate-400 text-xs">
              SAFE HIRE operates in full adherence with the Digital Personal Data Protection Act (DPDP) and international data confidentiality guidelines.
            </p>
          </section>
        </div>

        <div className="pt-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs tracking-wide transition-all shadow-md"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
