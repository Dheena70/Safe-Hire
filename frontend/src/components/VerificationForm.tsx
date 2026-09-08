import React, { useState } from 'react';
import { predictJob, fetchJobUrl, PredictionRequest, PredictionResponse, describeApiError } from '../services/api';
import { generateSecurityAuditPDF } from '../utils/pdfGenerator';
import bgImage from '../assets/safe-hire-bg.png';

interface VerificationFormProps {
  initialData?: { company_name?: string; cin?: string } | null;
}

const VerificationForm: React.FC<VerificationFormProps> = ({ initialData }) => {
  const [formData, setFormData] = useState<PredictionRequest>({
    company_name: initialData?.company_name || '',
    title: '',
    description: '',
    email: '',
    website: '',
    cin: initialData?.cin || '',
  });

  React.useEffect(() => {
    if (initialData?.company_name) {
      setFormData((prev) => ({
        ...prev,
        company_name: initialData.company_name || prev.company_name,
        cin: initialData.cin || prev.cin,
      }));
    }
  }, [initialData]);

  const [jobUrl, setJobUrl] = useState('');
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [urlSuccess, setUrlSuccess] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const MAX_DESCRIPTION_LENGTH = 2000;

  // Preset Sample Scenarios for 1-Click Testing
  const SAMPLE_PRESETS = {
    realCin: {
      company_name: 'Microsoft India Private Limited',
      title: 'Software Development Engineer Intern',
      description: 'We are looking for a Software Development Engineer Intern to join our Azure cloud engineering team. Responsibilities include building scalable distributed backend services, designing APIs, and writing automated unit tests. Qualifications: proficiency in C#, Java, or Python, data structures, and algorithms.',
      email: 'careers@microsoft.com',
      website: 'https://www.microsoft.com',
      cin: 'U74140DL1995PTC067938',
    },
    realNoEmailWeb: {
      company_name: 'Tata Consultancy Services Limited',
      title: 'Cloud Infrastructure Associate',
      description: 'TCS is hiring Cloud Infrastructure Engineers. Responsibilities involve configuring secure enterprise networks, monitoring Kubernetes deployments, and collaborating on global client projects. Bachelor degree in Engineering required.',
      email: '',
      website: '',
      cin: 'U72200MH1945PLC006822',
    },
    scam: {
      company_name: 'Quick Money Solutions',
      title: 'Work From Home Data Entry Intern',
      description: 'Urgent requirement! Earn 5000 per day from home with zero experience. Simple copy-paste and form filling work. Immediate hiring with no interview required. Weekly guaranteed payment directly to bank account.',
      email: 'quickmoneysolutions@gmail.com',
      website: '',
      cin: '',
    }
  };

  const handleLoadPreset = (presetKey: 'realCin' | 'realNoEmailWeb' | 'scam') => {
    setFormData(SAMPLE_PRESETS[presetKey]);
    setResult(null);
    setError(null);
  };

  const handleClear = () => {
    setFormData({
      company_name: '',
      title: '',
      description: '',
      email: '',
      website: '',
      cin: '',
    });
    setJobUrl('');
    setUrlSuccess(null);
    setResult(null);
    setError(null);
  };

  const handleFetchJobUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobUrl.trim()) return;
    setFetchingUrl(true);
    setError(null);
    setUrlSuccess(null);
    try {
      const fetched = await fetchJobUrl(jobUrl.trim());
      setFormData((prev) => ({
        ...prev,
        company_name: fetched.company_name || prev.company_name,
        title: fetched.title || prev.title,
        description: fetched.description || prev.description,
        email: fetched.email || prev.email,
        website: fetched.website || prev.website,
      }));
      setUrlSuccess(`✓ Auto-extracted details for "${fetched.company_name || 'Job Listing'}"!`);
      setTimeout(() => setUrlSuccess(null), 6000);
    } catch (err: any) {
      setError(describeApiError(err));
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'description' && value.length > MAX_DESCRIPTION_LENGTH) {
      return;
    }
    // Auto-uppercase for CIN field
    const finalValue = name === 'cin' ? value.toUpperCase().trim() : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setShowNotification(false);

    try {
      const response = await predictJob(formData);
      setResult(response);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    } catch (err: any) {
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!result) return;
    const reportText = `=====================================================
SAFE HIRE - VERIFICATION & FRAUD ANALYSIS REPORT
=====================================================
Generated At: ${new Date().toLocaleString()}
Company Name: ${formData.company_name}
Job Title:    ${formData.title}
MCA CIN:      ${formData.cin || 'Not Provided'}
Contact Email: ${formData.email || 'Not Provided'}
Website:      ${formData.website || 'Not Provided'}

-----------------------------------------------------
VERIFICATION ASSESSMENT
-----------------------------------------------------
Final Result:             ${result.prediction}
Confidence in Legitimacy: ${(result.probability * 100).toFixed(1)}%
Risk Level:               ${result.risk_level}
Suspicious Score:         ${result.suspicious_score}/10
Verification Status:      ${result.verification_status}
CIN Verification:         ${result.cin_verified} ${result.registered_company_name ? `(${result.registered_company_name})` : ''}
Regional Registry:        ${result.tamil_nadu_registered === true ? 'Verified Registered Entity' : (result.tamil_nadu_registered === false ? 'Not Found in Registry' : 'Unknown')}
Scam Database Check:      ${result.scam_status}

-----------------------------------------------------
KEY DIAGNOSTIC SIGNALS
-----------------------------------------------------
${result.reasons && result.reasons.length > 0
  ? result.reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')
  : 'All automated security heuristics passed without issue.'}

=====================================================
DISCLAIMER: SAFE HIRE provides automated risk detection
signals for advisory purposes. Always verify employment
contracts with official registered corporate sources.
=====================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedName = formData.company_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `safe_hire_audit_${sanitizedName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const confidencePct = result ? (result.probability * 100) : 0;

  return (
    <div className="min-h-screen relative py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Graphic with dark overlay */}
      <div 
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-950/80 via-slate-950/95 to-slate-950 pointer-events-none" />

      {/* Floating Notification Toast */}
      {showNotification && (
        <div className="fixed top-20 right-6 z-50 transition-all duration-300 transform translate-y-0">
          <div className="backdrop-blur-xl bg-slate-900/95 border-l-4 border-emerald-500 text-emerald-300 p-4 rounded-xl shadow-2xl border border-slate-700/80 max-w-md flex items-center space-x-3">
            <span className="text-2xl">✨</span>
            <div>
              <p className="font-bold text-white text-sm">Verification Complete</p>
              <p className="text-xs text-slate-300">AI ensemble, CIN lookup & rule diagnostics calculated.</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wide shadow-inner">
            <span className="animate-pulse">⚡</span>
            <span>AI-Powered Job Scam & Company Verification Core • v2.1</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Verify Legitimacy Before You Apply
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
            Cross-reference job offers with MCA Corporate Identification Numbers (CIN), regional registries, TF-IDF NLP text classifiers, and live fraud databases.
          </p>

          {/* Key Security Pillars Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs font-medium px-3 py-1 bg-slate-800/80 border border-slate-700/70 rounded-lg text-slate-300 flex items-center space-x-1.5">
              <span>🏷️</span>
              <span>Official MCA CIN Lookup</span>
            </span>
            <span className="text-xs font-medium px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 flex items-center space-x-1.5 font-semibold">
              <span>🏛️</span>
              <span>MCA South India Registry (8L+ Entities)</span>
            </span>
            <span className="text-xs font-medium px-3 py-1 bg-slate-800/80 border border-slate-700/70 rounded-lg text-slate-300 flex items-center space-x-1.5">
              <span>🧠</span>
              <span>NLP TF-IDF Ensemble (4 Models)</span>
            </span>
            <span className="text-xs font-medium px-3 py-1 bg-slate-800/80 border border-slate-700/70 rounded-lg text-slate-300 flex items-center space-x-1.5">
              <span>🛡️</span>
              <span>Fraud Pattern Heuristics</span>
            </span>
          </div>
        </div>

        {/* 1-Click Job URL Auto-Fetcher */}
        <div className="backdrop-blur-xl bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-5 shadow-xl shadow-cyan-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-cyan-400 text-base">🌐</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                1-Click Job URL Auto-Fetcher (LinkedIn, Naukri, Indeed, Careers)
              </h3>
            </div>
            <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-mono">
              SSRF Protected
            </span>
          </div>

          <form onSubmit={handleFetchJobUrl} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="Paste job URL (e.g. https://www.linkedin.com/jobs/view/... or https://www.naukri.com/...)"
                className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={fetchingUrl || !jobUrl.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 shrink-0"
            >
              {fetchingUrl ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Extracting Details...</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Auto-Fill Form</span>
                </>
              )}
            </button>
          </form>

          {urlSuccess && (
            <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl font-medium flex items-center gap-2 animate-fadeIn">
              <span>✨</span>
              <span>{urlSuccess}</span>
            </div>
          )}
        </div>

        {/* 1-Click Interactive Test Preset Loaders */}
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <span className="text-cyan-400">💡</span>
              <span>Instant Test Presets:</span>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleLoadPreset('realCin')}
                className="px-3 py-1.5 text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg transition duration-200 flex items-center space-x-1.5"
              >
                <span>🟢</span>
                <span>Real Job + CIN (Microsoft)</span>
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset('realNoEmailWeb')}
                className="px-3 py-1.5 text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg transition duration-200 flex items-center space-x-1.5"
              >
                <span>🔵</span>
                <span>Real Job (No Email/Web)</span>
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset('scam')}
                className="px-3 py-1.5 text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg transition duration-200 flex items-center space-x-1.5"
              >
                <span>🔴</span>
                <span>Scam Job (Data Entry)</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition"
                title="Clear all fields"
              >
                🧹 Clear
              </button>
            </div>
          </div>
        </div>

        {/* Main Verification Card */}
        <div className="backdrop-blur-2xl bg-slate-900/85 border border-slate-700/60 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-cyan-950/20 relative overflow-hidden">
          {/* Top Accent Gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600"></div>

          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2.5">
                <span>🔍</span>
                <span>Company & Job Verification Form</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Company name, job title, and description are required. CIN, email, and website are optional.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 2-Column Grid: Company Name & Job Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Company Name */}
              <div>
                <label htmlFor="company_name" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                  <span>Company Name <span className="text-rose-400">*</span></span>
                  <span className="text-[10px] text-slate-500 font-normal">Official / Trading Name</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm">
                    🏢
                  </div>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    required
                    value={formData.company_name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-sm transition"
                    placeholder="e.g., Microsoft India Private Limited"
                  />
                </div>
              </div>

              {/* Job Title */}
              <div>
                <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                  <span>Job Title <span className="text-rose-400">*</span></span>
                  <span className="text-[10px] text-slate-500 font-normal">Designation</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm">
                    💼
                  </div>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-sm transition"
                    placeholder="e.g., Software Development Engineer Intern"
                  />
                </div>
              </div>
            </div>

            {/* CIN (Corporate Identification Number) - Optional */}
            <div>
              <label htmlFor="cin" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <span>🏷️ MCA CIN (Corporate Identification Number)</span>
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">Optional</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">21-character MCA Reg. No.</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm font-mono">
                  #
                </div>
                <input
                  type="text"
                  id="cin"
                  name="cin"
                  value={formData.cin || ''}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-sm font-mono tracking-wider transition"
                  placeholder="e.g., U74140DL1995PTC067938 or U72900TN2022PTC155100"
                />
              </div>
            </div>

            {/* Job Description with Dynamic Character Counter */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <span>📄 Job Description & Offer Details <span className="text-rose-400">*</span></span>
                </label>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                  formData.description.length >= MAX_DESCRIPTION_LENGTH - 50
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {formData.description.length} / {MAX_DESCRIPTION_LENGTH} chars
                </span>
              </div>
              <textarea
                id="description"
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full p-4 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-sm transition resize-y leading-relaxed font-sans"
                placeholder="Paste the complete job description, roles, requirements, salary claims, or offer letter excerpts here..."
              />
              <div className="w-full bg-slate-800/80 rounded-full h-1 mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    formData.description.length > 300 ? 'bg-cyan-400' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, (formData.description.length / 300) * 100)}%` }}
                />
              </div>
            </div>

            {/* 2-Column Grid: Contact Email & Website (Both Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Contact Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span>Contact Email</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">Optional</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">HR / Recruiter Email</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm">
                    ✉️
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-sm transition"
                    placeholder="e.g., careers@microsoft.com (optional)"
                  />
                </div>
              </div>

              {/* Company Website */}
              <div>
                <label htmlFor="website" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span>Company Website</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">Optional</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Official Domain URL</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm">
                    🌐
                  </div>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    value={formData.website || ''}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-sm transition"
                    placeholder="e.g., https://www.microsoft.com (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition duration-300 shadow-xl shadow-cyan-500/20 flex items-center justify-center text-base tracking-wide"
            >
              {loading ? (
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Running Deep ML, CIN & Registry Forensic Analysis...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>🛡️</span>
                  <span>Run AI Verification Analysis</span>
                </div>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-500/10 border-l-4 border-rose-500 text-rose-300 p-4 rounded-xl border border-rose-500/30 text-sm">
                <p className="font-bold flex items-center space-x-2">
                  <span>❌</span>
                  <span>Analysis Request Failed</span>
                </p>
                <p className="mt-1 text-xs text-rose-200">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* High-Tech Results Visualizer Card */}
        {result && (
          <div className="backdrop-blur-2xl bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden animate-fade-in space-y-8">
            {/* Ambient Result Glow */}
            <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none -z-10 ${
              result.prediction === 'REAL' ? 'bg-emerald-500/15' : 'bg-rose-500/15'
            }`} />

            {/* Result Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Security Audit Result</span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{formData.company_name}</h3>
                <p className="text-xs text-slate-400">{formData.title}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-4 py-2 rounded-xl text-sm font-extrabold tracking-wide uppercase border flex items-center space-x-2 ${
                  result.prediction === 'REAL'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-lg shadow-rose-500/10'
                }`}>
                  <span className="text-lg">{result.prediction === 'REAL' ? '✅' : '❌'}</span>
                  <span>{result.prediction === 'REAL' ? 'VERIFIED LEGITIMATE (REAL)' : 'DETECTED FRAUDULENT (FAKE)'}</span>
                </span>
              </div>
            </div>

            {/* Visual Confidence Gauge & Risk Level */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Confidence Meter */}
              <div className="bg-slate-950/70 border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Legitimacy Confidence</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-4xl font-extrabold text-cyan-400 font-mono">{confidencePct.toFixed(1)}%</span>
                    <span className="text-xs text-slate-500">score</span>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 mt-4 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      confidencePct >= 70 ? 'bg-emerald-400' : confidencePct >= 40 ? 'bg-amber-400' : 'bg-rose-500'
                    }`}
                    style={{ width: `${confidencePct}%` }}
                  />
                </div>
              </div>

              {/* Risk Level Badge */}
              <div className="bg-slate-950/70 border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Threat / Risk Tier</span>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className="text-3xl">
                      {result.risk_level === 'High' ? '🔴' : result.risk_level === 'Medium' ? '🟡' : '🟢'}
                    </span>
                    <div>
                      <p className={`text-2xl font-bold ${
                        result.risk_level === 'High' ? 'text-rose-400' : result.risk_level === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {result.risk_level} Risk
                      </p>
                      <p className="text-[11px] text-slate-500">Status: {result.verification_status}</p>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/60 font-mono">
                  Suspicion Index: {result.suspicious_score} / 10
                </div>
              </div>

              {/* MCA CIN & Registry Matrix */}
              <div className="bg-slate-950/70 border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">MCA CIN Verification</span>
                  <p className="text-sm font-semibold text-white mt-2 leading-snug">
                    {result.cin_verified === true ? (
                      <span className="text-emerald-400 font-bold">✅ Verified Government MCA CIN</span>
                    ) : (
                      result.cin_verified === 'Not Provided' ? (
                        <span className="text-slate-400">CIN Not Provided (Registry Lookup Used)</span>
                      ) : (
                        <span className="text-amber-400">{result.cin_verified}</span>
                      )
                    )}
                  </p>
                  {result.registered_company_name && (
                    <p className="text-[11px] text-cyan-300 mt-1 truncate">
                      Entity: {result.registered_company_name}
                    </p>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <span>Registry Status:</span>
                  <span className={`font-semibold ${result.tamil_nadu_registered === true ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {result.tamil_nadu_registered === true ? '✅ Registered' : (result.tamil_nadu_registered === false ? '⚠️ Not Found' : 'Unknown')}
                  </span>
                </div>
              </div>
            </div>

            {/* Key Diagnostic Signals */}
            <div className="bg-slate-950/60 border border-slate-800/80 p-6 rounded-2xl space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <span>🔎</span>
                <span>Automated Forensic Signals</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.reasons && result.reasons.length > 0 ? (
                  result.reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start space-x-2.5 bg-slate-900/80 p-3 rounded-xl border border-slate-800/60">
                      <span className="text-cyan-400 text-sm mt-0.5">📌</span>
                      <p className="text-xs text-slate-300 leading-relaxed">{reason}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400">All standard security checks cleared.</div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => generateSecurityAuditPDF(formData, result)}
                className="flex-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold py-3.5 px-6 rounded-xl transition shadow-lg shadow-cyan-950/30 flex items-center justify-center space-x-2 text-sm"
              >
                <span>📜</span>
                <span>Download Official Audit Certificate (PDF)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadReport}
                className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl transition border border-slate-700 flex items-center justify-center space-x-2 text-xs"
                title="Download raw forensic log"
              >
                <span>📄</span>
                <span>Audit Log (.txt)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  handleClear();
                }}
                className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl transition border border-slate-700 text-xs"
              >
                Verify Another Listing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationForm;
