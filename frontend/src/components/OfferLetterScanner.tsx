import React, { useState, useRef } from 'react';
import { scanOfferLetter, OfferScanResponse, describeApiError } from '../services/api';

export const OfferLetterScanner: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'upload' | 'paste'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OfferScanResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.txt')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please upload a valid PDF (.pdf) or Text (.txt) offer letter.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleScan = async () => {
    setError(null);
    if (activeMode === 'upload' && !selectedFile) {
      setError('Please select or drag-and-drop an offer letter PDF to scan.');
      return;
    }
    if (activeMode === 'paste' && (!pastedText.trim() || pastedText.trim().length < 20)) {
      setError('Please paste the full text of your offer letter (minimum 20 characters).');
      return;
    }

    setLoading(true);
    try {
      const input = activeMode === 'upload' ? selectedFile! : pastedText;
      const res = await scanOfferLetter(input);
      setResult(res);
    } catch (err: any) {
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSelectedFile(null);
    setPastedText('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <span>📄</span> AI Document Forensics
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Offer Letter Fraud Scanner
            </h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Upload your appointment or offer letter to instantly detect fake security deposit demands, generic webmail HR accounts, stamp paper extortion, and corporate impersonation.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800 self-stretch sm:self-auto">
            <button
              onClick={() => { setActiveMode('upload'); setError(null); }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeMode === 'upload'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Upload PDF
            </button>
            <button
              onClick={() => { setActiveMode('paste'); setError(null); }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeMode === 'paste'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Paste Text
            </button>
          </div>
        </div>
      </div>

      {!result ? (
        /* Upload / Input Card */
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3 animate-fadeIn">
              <span className="text-lg">⚠️</span>
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {activeMode === 'upload' ? (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.txt"
                className="hidden"
              />
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-950/20 scale-[0.99]'
                    : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-950/10'
                    : 'border-slate-700/80 bg-slate-950/50 hover:border-cyan-500/50 hover:bg-slate-950/80'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-transform duration-300 ${
                  selectedFile
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 group-hover:scale-110'
                }`}>
                  {selectedFile ? '📑' : '📤'}
                </div>

                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-200">
                    {selectedFile ? selectedFile.name : 'Click to upload or drag & drop Offer Letter'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB — Ready for AI Forensic Analysis`
                      : 'Supports PDF (.pdf) and Plain Text (.txt) up to 10MB'}
                  </p>
                </div>

                {selectedFile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 underline font-medium"
                  >
                    Remove File
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Offer Letter Text / Email Body
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the full offer letter content, salary details, joining instructions, and recruiter email address here..."
                rows={10}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-mono leading-relaxed"
              />
              <div className="flex justify-between items-center text-xs text-slate-500 px-1">
                <span>Supports full offer letters, email transcripts & joining letters</span>
                <span>{pastedText.length} characters</span>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleScan}
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 focus:ring-4 focus:ring-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Forensic AI Engine Scanning Offer Letter...</span>
                </>
              ) : (
                <>
                  <span>🛡️</span>
                  <span>Analyze Offer Letter Legitimacy</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6 animate-fadeIn">
          {/* Top Verdict Banner */}
          <div
            className={`rounded-2xl p-6 sm:p-8 border shadow-2xl relative overflow-hidden ${
              result.verdict === 'GENUINE'
                ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border-emerald-500/40 shadow-emerald-950/30'
                : result.verdict === 'SUSPICIOUS'
                ? 'bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 border-amber-500/40 shadow-amber-950/30'
                : 'bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-950 border-rose-500/40 shadow-rose-950/40'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-3 h-3 rounded-full animate-pulse ${
                      result.verdict === 'GENUINE'
                        ? 'bg-emerald-400'
                        : result.verdict === 'SUSPICIOUS'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  />
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
                    Forensic Verdict
                  </span>
                </div>
                <h3
                  className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    result.verdict === 'GENUINE'
                      ? 'text-emerald-300'
                      : result.verdict === 'SUSPICIOUS'
                      ? 'text-amber-300'
                      : 'text-rose-300'
                  }`}
                >
                  {result.status_label}
                </h3>
                <p className="text-sm text-slate-300 max-w-lg">
                  {result.verdict === 'GENUINE'
                    ? 'No predatory clauses or suspicious fee demands detected. Always verify salary terms and physical workplace.'
                    : result.verdict === 'SUSPICIOUS'
                    ? 'Several caution indicators were flagged. Contact HR through official website channels before signing.'
                    : 'CRITICAL WARNING: This document exhibits high-probability recruitment fraud signatures. Never pay any fees.'}
                </p>
              </div>

              {/* Legitimacy Score Circle */}
              <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shrink-0">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={
                        result.legitimacy_score >= 70
                          ? 'text-emerald-400'
                          : result.legitimacy_score >= 40
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }
                      strokeDasharray={`${result.legitimacy_score}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-100">
                      {result.legitimacy_score}%
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase">Legitimacy Score</div>
                  <div className="text-sm font-bold text-slate-200">
                    {result.legitimacy_score >= 70 ? 'High Confidence' : result.legitimacy_score >= 40 ? 'Moderate Caution' : 'Severe Fraud Risk'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Extracted Details Grid */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span>📋</span> Extracted Document Entities
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Issuer / Company</div>
                <div className="text-sm font-semibold text-slate-100 mt-1 truncate">
                  {result.extracted_details.company_name || 'Not Detected'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Role / Designation</div>
                <div className="text-sm font-semibold text-slate-100 mt-1 truncate">
                  {result.extracted_details.job_title || 'Not Specified'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Offered CTC / Salary</div>
                <div className="text-sm font-semibold text-emerald-400 mt-1 truncate">
                  {result.extracted_details.salary || 'Not Mentioned'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Detected Recruiter Email</div>
                <div className="text-sm font-semibold text-slate-100 mt-1 truncate">
                  {result.extracted_details.emails.length > 0
                    ? result.extracted_details.emails.join(', ')
                    : 'No Email Found'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Government MCA CIN</div>
                <div className="text-sm font-semibold text-slate-100 mt-1 truncate">
                  {result.extracted_details.cin || 'No CIN In Letter'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Scanned Document Size</div>
                <div className="text-sm font-semibold text-slate-100 mt-1 truncate">
                  {result.extracted_details.char_count} characters
                </div>
              </div>
            </div>
          </div>

          {/* Red & Green Flags Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Red Flags */}
            <div className="bg-slate-900/80 border border-rose-500/20 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <span>🚨</span> Red Flags & Suspicious Signals ({result.red_flags.length})
              </h4>
              {result.red_flags.length > 0 ? (
                <ul className="space-y-2.5">
                  {result.red_flags.map((flag, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-rose-200 bg-rose-950/30 border border-rose-900/40 p-3 rounded-xl flex items-start gap-2.5"
                    >
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span className="leading-relaxed">{flag}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-slate-400 bg-slate-950 p-4 rounded-xl text-center">
                  No explicit red flags detected in scanned text.
                </div>
              )}
            </div>

            {/* Green Flags */}
            <div className="bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <span>✅</span> Legitimate Verification Indicators ({result.green_flags.length})
              </h4>
              {result.green_flags.length > 0 ? (
                <ul className="space-y-2.5">
                  {result.green_flags.map((flag, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-emerald-200 bg-emerald-950/30 border border-emerald-900/40 p-3 rounded-xl flex items-start gap-2.5"
                    >
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span className="leading-relaxed">{flag}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-slate-400 bg-slate-950 p-4 rounded-xl text-center">
                  Limited positive signals found. Proceed with standard verification.
                </div>
              )}
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
              <span>💡</span> Recommended Candidate Actions
            </h4>
            <div className="space-y-2">
              {result.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 leading-relaxed"
                >
                  {rec}
                </div>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-2 text-center">
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold tracking-wide transition-all border border-slate-700 shadow-md"
            >
              🔄 Scan Another Offer Letter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
