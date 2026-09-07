import React from 'react';

interface Props {
  onBackToHome: () => void;
}

export const NotFound: React.FC<Props> = ({ onBackToHome }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-xl w-full text-center space-y-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-cyan-950/40 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* 404 Glitch Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold font-mono tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          Error 404 • Sector Quarantined
        </div>

        {/* Big Glitch Title */}
        <div className="space-y-2">
          <h1 className="text-6xl sm:text-8xl font-black font-mono tracking-tighter bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
            Security Vector Not Found
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            The endpoint or resource you are looking for has been moved, blocked by firewall heuristics, or does not exist in the SAFE HIRE defense grid.
          </p>
        </div>

        {/* Terminal Box */}
        <div className="text-left bg-slate-950/90 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-1.5 text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-500 pb-1 border-b border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            <span className="ml-2 text-[10px] text-slate-400">DIAGNOSTIC_TRACE</span>
          </div>
          <p className="text-rose-400">ERR_ROUTING_TARGET_UNDEFINED: 0x404_SEC_BREACH</p>
          <p className="text-slate-500">&gt; Scanning active modules... [VERIFY, SCANNER, SCAM_FEED]</p>
          <p className="text-cyan-400">&gt; Recommendation: Return to core verification terminal.</p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
          >
            <span>🛡️</span>
            <span>Return to Security Hub</span>
          </button>
        </div>
      </div>
    </div>
  );
};
