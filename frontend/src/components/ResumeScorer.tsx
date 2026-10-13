import React, { useState, useRef } from 'react';
import { scoreResume, ResumeScoreResponse, describeApiError } from '../services/api';

interface Props {
  onSwitchToOfferScan?: () => void;
}

export const ResumeScorer: React.FC<Props> = ({ onSwitchToOfferScan }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResumeScoreResponse | null>(null);

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
      const name = file.name.toLowerCase();
      if (name.endsWith('.pdf') || name.endsWith('.txt') || name.endsWith('.docx') || name.endsWith('.doc')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please upload a valid PDF (.pdf), Word (.docx), or Text (.txt) resume file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleScore = async () => {
    setError(null);
    if (!selectedFile) {
      setError('Please select or drag-and-drop a resume file (PDF, DOCX, or TXT) to score.');
      return;
    }

    setLoading(true);
    try {
      const res = await scoreResume(selectedFile, targetRole);
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
    setTargetRole('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-cyan-400';
    if (score >= 45) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
    if (score >= 60) return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300';
    if (score >= 45) return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
    return 'bg-rose-500/10 border-rose-500/30 text-rose-300';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <svg className="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span>ATS Readiness & Privacy Shield</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              AI Resume Scorer & Privacy Auditor
            </h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Evaluate your resume for ATS parsability, impact metrics, strong action verbs, and section completeness while auditing against identity theft (Aadhaar & PAN card leakage).
            </p>
          </div>
        </div>
      </div>

      {!result ? (
        /* Input & Upload View */
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3 animate-fadeIn">
              <svg className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Target Role Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Target Job Role (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Data Quality Analyst, Full Stack Developer, Machine Learning Engineer"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              <div className="absolute right-3 top-3 text-xs text-slate-500">
                Helps tailor role-specific keywords
              </div>
            </div>
          </div>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.txt,.docx,.doc"
                className="hidden"
              />
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
                  isDragging
                    ? 'border-indigo-400 bg-indigo-950/20 scale-[0.99]'
                    : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-950/10'
                    : 'border-slate-700/80 bg-slate-950/50 hover:border-indigo-500/50 hover:bg-slate-950/80'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 ${
                  selectedFile
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 text-indigo-400 border border-indigo-500/30'
                }`}>
                  {selectedFile ? (
                    <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <path d="m9 15 2 2 4-4"/>
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-200">
                    {selectedFile ? selectedFile.name : 'Click to upload or drag & drop your Resume'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB — Ready for ATS analysis`
                      : 'Supports PDF (.pdf), Word (.docx), and Plain Text (.txt) up to 10MB'}
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

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleScore}
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Analyzing Resume ATS Structure & Privacy Shield...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <span>Score My Resume & Audit Privacy</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6 animate-fadeIn">
          {/* Top Score Banner */}
          <div className="rounded-2xl p-6 sm:p-8 border shadow-2xl relative overflow-hidden bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border-indigo-500/40 shadow-indigo-950/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
                    ATS Audit Verdict
                  </span>
                  {result.target_role && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Target: {result.target_role}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  ATS Score: <span className={getScoreColor(result.overall_score)}>{result.overall_score}/100</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${getScoreBg(result.overall_score)}`}>
                    Grade: {result.grade}
                  </span>
                  <span className="text-xs text-slate-400">
                    {result.word_count} words | {result.action_verbs_count} action verbs | {result.metrics_count} quantified achievements
                  </span>
                </div>
              </div>

              {/* Radial Score Circle */}
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
                      className={getScoreColor(result.overall_score)}
                      strokeDasharray={`${result.overall_score}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-100">
                      {result.overall_score}%
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase">ATS Rank</div>
                  <div className="text-sm font-bold text-slate-200">
                    {result.overall_score >= 80 ? 'Elite Ready' : result.overall_score >= 60 ? 'Competitive' : 'Needs Optimization'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Anti-Scam Shield Alert */}
          {result.privacy_alerts && result.privacy_alerts.length > 0 ? (
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-300">
                <svg className="w-5 h-5 text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
                <span>CRITICAL PRIVACY WARNING: Sensitive Identity Information Detected</span>
              </div>
              <ul className="space-y-1.5 text-xs text-rose-200/90 pl-7 list-disc">
                {result.privacy_alerts.map((alert, idx) => (
                  <li key={idx} className="leading-relaxed">{alert}</li>
                ))}
              </ul>
              <p className="text-xs text-rose-300 font-semibold pt-1">
                Tip: Scammers run fake recruitment drives specifically to harvest Aadhaar and PAN cards for loan fraud and SIM-box laundering. Never include government identity numbers in resumes submitted to public portals.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-3">
              <svg className="w-5 h-5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              <div className="text-xs">
                <span className="font-bold">Privacy Shield Verified: </span>
                No sensitive identity card numbers (Aadhaar or PAN) detected. Safe to share with prospective employers.
              </div>
            </div>
          )}

          {/* Candidate Profile Summary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>Parsed Candidate Profile & Metadata</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Candidate Name</div>
                <div className="text-sm font-semibold text-slate-100 mt-1 truncate">
                  {result.candidate.name || 'Not Identified'}
                </div>
              </div>
              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Email Address</div>
                <div className="text-sm font-semibold text-slate-100 mt-1 truncate">
                  {result.candidate.email || 'Not Found'}
                </div>
              </div>
              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Phone Contact</div>
                <div className="text-sm font-semibold text-slate-100 mt-1 truncate">
                  {result.candidate.phone || 'Not Found'}
                </div>
              </div>
              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Word Count</div>
                <div className="text-sm font-semibold text-cyan-400 mt-1">
                  {result.word_count} words
                </div>
              </div>
            </div>
          </div>

          {/* Section Breakdown Grid (5 Pillars) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"/>
                <path d="m19 9-5 5-4-4-3 3"/>
              </svg>
              <span>ATS Scoring Pillars Breakdown</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Section Coverage</span>
                  <span className="font-bold text-slate-200">{result.section_scores.sections_coverage}/25</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(result.section_scores.sections_coverage / 25) * 100}%` }}></div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Action Verbs</span>
                  <span className="font-bold text-slate-200">{result.section_scores.action_verbs}/20</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(result.section_scores.action_verbs / 20) * 100}%` }}></div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Metrics Impact</span>
                  <span className="font-bold text-slate-200">{result.section_scores.quantifiable_impact}/20</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(result.section_scores.quantifiable_impact / 20) * 100}%` }}></div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Keywords & Skills</span>
                  <span className="font-bold text-slate-200">{result.section_scores.technical_keywords}/20</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(result.section_scores.technical_keywords / 20) * 100}%` }}></div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Length & Structure</span>
                  <span className="font-bold text-slate-200">{result.section_scores.length_formatting}/15</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(result.section_scores.length_formatting / 15) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Extracted Skills Cloud */}
          {result.skills && result.skills.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6"/>
                  <polyline points="8 6 2 12 8 18"/>
                </svg>
                <span>Detected Technical Skills & Tooling ({result.skills.length})</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-950 border border-slate-800 text-cyan-300 hover:border-cyan-500/40 transition"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section Found / Missing Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Found ATS Sections ({result.sections_found.length})</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.sections_found.map((sec, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 capitalize">
                    {sec}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-amber-500/20 rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Missing Suggested Sections ({result.sections_missing.length})</span>
              </h4>
              {result.sections_missing.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.sections_missing.map((sec, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-950/40 border border-amber-900/50 text-amber-300 capitalize">
                      Add {sec}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">All essential ATS sections are present in your resume!</p>
              )}
            </div>
          </div>

          {/* Strengths & Improvement Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Key Resume Strengths ({result.strengths.length})</span>
              </h4>
              <ul className="space-y-2">
                {result.strengths.map((str, idx) => (
                  <li key={idx} className="text-xs text-slate-200 bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span className="leading-relaxed">{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span>Actionable ATS Improvements ({result.improvements.length})</span>
              </h4>
              <ul className="space-y-2">
                {result.improvements.map((imp, idx) => (
                  <li key={idx} className="text-xs text-slate-200 bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                    <span className="leading-relaxed">{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Reset / Rescore Button & Offer Letter Switch */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold tracking-wide transition-all border border-slate-700 shadow-md"
            >
              <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M8 16H3v5"/>
              </svg>
              <span>Score Another Resume</span>
            </button>

            {onSwitchToOfferScan && (
              <button
                onClick={onSwitchToOfferScan}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-bold tracking-wide transition-all border border-cyan-500/40"
              >
                <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>Received an Offer Letter? Verify It Here</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
