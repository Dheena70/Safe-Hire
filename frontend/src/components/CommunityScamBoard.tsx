import React, { useState, useEffect } from 'react';
import {
  getScams,
  reportScam,
  voteScam,
  ScamRecord,
  ReportScamRequest,
  describeApiError,
} from '../services/api';

const SCAM_CATEGORIES = [
  'All',
  'Data Entry',
  'Telegram Task',
  'Fake MNC',
  'Abroad Job',
  'Fee Demand',
  'Other',
];

export const CommunityScamBoard: React.FC = () => {
  const [scams, setScams] = useState<ScamRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  // Form state
  const [companyName, setCompanyName] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [scamType, setScamType] = useState<string>('Data Entry');
  const [description, setDescription] = useState<string>('');
  const [contactInfo, setContactInfo] = useState<string>('');
  const [demandedAmount, setDemandedAmount] = useState<string>('');
  const [reportedBy, setReportedBy] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchScams = async (q = searchQuery, cat = selectedCategory) => {
    setLoading(true);
    try {
      const res = await getScams({
        q: q.trim() || undefined,
        category: cat !== 'All' ? cat : undefined,
      });
      setScams(res.scams);
    } catch (err) {
      console.error('Failed to load scam feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScams(searchQuery, selectedCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchScams(searchQuery, selectedCategory);
  };

  const handleVote = async (scamId: string) => {
    if (votedIds.has(scamId)) return;
    try {
      const res = await voteScam(scamId);
      setVotedIds((prev) => new Set(prev).add(scamId));
      setScams((prev) =>
        prev.map((s) => (s.id === scamId ? { ...s, votes: res.votes } : s))
      );
    } catch (err) {
      console.error('Voting failed:', err);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!companyName.trim() || !description.trim()) {
      setFormError('Company Name and Description are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: ReportScamRequest = {
        company_name: companyName.trim(),
        job_title: jobTitle.trim() || undefined,
        scam_type: scamType,
        description: description.trim(),
        contact_info: contactInfo.trim() || undefined,
        demanded_amount: demandedAmount.trim() || undefined,
        reported_by: reportedBy.trim() || 'Anonymous Reporter',
      };

      const res = await reportScam(payload);
      setScams((prev) => [res.scam, ...prev]);
      setSuccessMsg('Scam incident successfully posted! Thank you for protecting job seekers.');
      setCompanyName('');
      setJobTitle('');
      setDescription('');
      setContactInfo('');
      setDemandedAmount('');
      setReportedBy('');
      setTimeout(() => {
        setIsReportModalOpen(false);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setFormError(describeApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <span>🚨</span> Live Fraud Feed
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Community Scam Alert Board
            </h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Public crowd-sourced recruitment fraud registry. Search verified job scam syndicates, fake consultancy firms, and warn fellow candidates.
            </p>
          </div>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-5 py-3 rounded-xl font-bold text-xs tracking-wide text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 shadow-lg shadow-rose-500/25 transition-all flex items-center gap-2 shrink-0"
          >
            <span>📢</span>
            <span>Report a Scam</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search suspect company, job role, phone, Telegram handle, or keyword..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
            />
            <span className="absolute left-3.5 top-3.5 text-slate-500">🔍</span>
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs tracking-wide transition-all shadow-md"
          >
            Search
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {SCAM_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Scams Feed Grid */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="inline-block animate-spin text-3xl">⚙️</div>
          <p className="text-sm font-medium text-slate-400">Loading Community Scam Alerts...</p>
        </div>
      ) : scams.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="text-4xl">🛡️</div>
          <h3 className="text-base font-bold text-slate-200">No scams found matching your query</h3>
          <p className="text-xs text-slate-400">Try searching for a different keyword or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {scams.map((scam) => {
            const hasVoted = votedIds.has(scam.id);
            return (
              <div
                key={scam.id}
                className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                          {scam.scam_type}
                        </span>
                        {scam.verified_fraud && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <span>✓</span> Verified Scam
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-100 leading-snug">
                        {scam.company_name}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        Role: <span className="text-slate-300">{scam.job_title}</span>
                      </p>
                    </div>

                    {scam.demanded_amount && scam.demanded_amount !== 'N/A' && (
                      <div className="text-right shrink-0 bg-rose-950/40 border border-rose-800/40 px-2.5 py-1 rounded-lg">
                        <div className="text-[10px] font-semibold text-rose-400 uppercase">Demanded Fee</div>
                        <div className="text-xs font-bold text-rose-300">{scam.demanded_amount}</div>
                      </div>
                    )}
                  </div>

                  {/* Modus Operandi Description */}
                  <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-slate-300 leading-relaxed font-sans">
                    {scam.description}
                  </div>

                  {/* Contact / Channel */}
                  {scam.contact_info && scam.contact_info !== 'Not provided' && (
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                      <span>📞</span>
                      <span className="text-slate-300 truncate">{scam.contact_info}</span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Metadata & Upvote */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <div className="space-y-0.5">
                    <div>Reported by: <span className="text-slate-400 font-medium">{scam.reported_by}</span></div>
                    <div className="text-[10px] text-slate-600">{scam.date}</div>
                  </div>

                  <button
                    onClick={() => handleVote(scam.id)}
                    disabled={hasVoted}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                      hasVoted
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <span>{hasVoted ? '✓ Upvoted' : '▲ Confirm Scam'}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-950 text-[11px] font-mono">
                      {scam.votes}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>📢</span> Report a Recruitment Scam
                </h3>
                <p className="text-xs text-slate-400">
                  Help warn other candidates by documenting fraudulent recruiters or demands.
                </p>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl font-medium">
                {formError}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl font-medium">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Suspect Company / Consultancy Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Global Solutions / Impersonating TCS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Offered Job Role
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Data Entry Operator"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Scam Category
                  </label>
                  <select
                    value={scamType}
                    onChange={(e) => setScamType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="Data Entry">Data Entry Fraud</option>
                    <option value="Telegram Task">Telegram Task / Review Scam</option>
                    <option value="Fake MNC">Fake MNC Impersonation</option>
                    <option value="Abroad Job">Abroad Visa Scam</option>
                    <option value="Fee Demand">Upfront Fee Demand</option>
                    <option value="Other">Other Fraud</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Demanded Payment / Deposit Amount
                </label>
                <input
                  type="text"
                  value={demandedAmount}
                  onChange={(e) => setDemandedAmount(e.target.value)}
                  placeholder="e.g. ₹3,500 registration or laptop fee"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  How did the scam happen? (Modus Operandi) *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the scam process (e.g. contacted on WhatsApp, sent fake stamp paper agreement, asked for UPI payment)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 leading-relaxed font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Scammer Contact / Email / Handle
                  </label>
                  <input
                    type="text"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="e.g. +91 98451... / @telegram_bot"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={reportedBy}
                    onChange={(e) => setReportedBy(e.target.value)}
                    placeholder="e.g. Anonymous / Karthik"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold text-xs tracking-wide transition-all shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Publish Scam Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
