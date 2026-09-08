import React, { useState, useEffect } from 'react';
import { SafeCompany, searchSafeCompanies, getCompanyStats } from '../services/api';

interface SafeCompanyExplorerProps {
  onSelectCompany?: (companyName: string, cin?: string) => void;
}

const SOUTH_STATES = [
  { id: 'All', name: 'All South India', icon: '🇮🇳' },
  { id: 'Tamil Nadu', name: 'Tamil Nadu', icon: '📍' },
  { id: 'Karnataka', name: 'Karnataka (Bangalore)', icon: '📍' },
  { id: 'Telangana', name: 'Telangana (Hyderabad)', icon: '📍' },
  { id: 'Kerala', name: 'Kerala', icon: '📍' },
  { id: 'Andhra Pradesh', name: 'Andhra Pradesh', icon: '📍' },
];

const POPULAR_SAFE_PICKS = [
  'Zoho', 'Infosys', 'Tata Consultancy', 'Wipro', 'Cognizant', 
  'Freshworks', 'Hyundai Motor', 'TVS Motor', 'Apollo Hospitals', 'Flipkart', 'Swiggy'
];

export const SafeCompanyExplorer: React.FC<SafeCompanyExplorerProps> = ({ onSelectCompany }) => {
  const [query, setQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [companies, setCompanies] = useState<SafeCompany[]>([]);
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [copiedCin, setCopiedCin] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total: number; breakdown: Record<string, number> }>({
    total: 799384,
    breakdown: {
      'Tamil Nadu': 228433,
      'Karnataka': 217745,
      'Telangana': 193693,
      'Kerala': 99805,
      'Andhra Pradesh': 59708,
    },
  });

  // Load stats on mount
  useEffect(() => {
    getCompanyStats()
      .then((res) => {
        if (res.total_verified_companies) {
          setStats((prev) => ({
            total: res.total_verified_companies,
            breakdown: res.state_breakdown || prev.breakdown,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch safe companies on search / filter change
  const performSearch = React.useCallback(
    (searchQuery: string = query, stateFilter: string = selectedState, statusFilter: string = selectedStatus) => {
      setLoading(true);
      searchSafeCompanies(searchQuery, stateFilter, statusFilter, 30)
        .then((res) => {
          setCompanies(res.companies || []);
          setTotalMatches(res.total_matches || 0);
        })
        .catch((err) => {
          console.error('Failed to search companies:', err);
          setCompanies([]);
          setTotalMatches(0);
        })
        .finally(() => setLoading(false));
    },
    [query, selectedState, selectedStatus]
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(query, selectedState, selectedStatus);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, selectedState, selectedStatus, performSearch]);

  const handleCopyCin = (cin: string) => {
    navigator.clipboard.writeText(cin);
    setCopiedCin(cin);
    setTimeout(() => setCopiedCin(null), 2000);
  };

  const getStateBadgeStyle = (state: string) => {
    switch (state) {
      case 'Tamil Nadu':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Karnataka':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Telangana':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Kerala':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Andhra Pradesh':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/80 border border-slate-700/80 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>7,99,384+ Official MCA Verified Entities</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>🏛️ Verified Safe Companies Directory</span>
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Search and explore Government-registered companies across South India (TN, KA, TG, KL, AP).
              Quickly verify legit employers before applying to avoid scams.
            </p>
          </div>

          {/* Regional Summary Badge */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 bg-slate-950/70 border border-slate-700/60 p-4 rounded-xl backdrop-blur-md">
            <div className="text-xs text-slate-400">Total Registered Employers:</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {stats.total.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span> 5 South Indian States Covered
            </div>
          </div>
        </div>

        {/* State Breakdown Pills */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {Object.entries(stats.breakdown).map(([stName, count]) => (
            <div
              key={stName}
              onClick={() => setSelectedState(stName)}
              className={`p-2.5 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                selectedState === stName
                  ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              <div className="text-[11px] font-medium truncate">{stName}</div>
              <div className="text-sm font-bold font-mono text-white mt-1">
                {(count || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
        {/* Main Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Company Name (e.g. Zoho, Infosys) or 21-digit CIN..."
              className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* State Dropdown */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-400 transition"
          >
            {SOUTH_STATES.map((st) => (
              <option key={st.id} value={st.id} className="bg-slate-900 text-slate-200">
                {st.icon} {st.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-400 transition"
          >
            <option value="Active" className="bg-slate-900">🟢 Active Companies Only</option>
            <option value="All" className="bg-slate-900">All Registry Statuses</option>
          </select>
        </div>

        {/* Popular Quick-Search Tags */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 pt-1">
          <span className="font-semibold text-slate-300 mr-1">⚡ Quick Picks:</span>
          {POPULAR_SAFE_PICKS.map((pick) => (
            <button
              key={pick}
              onClick={() => { setQuery(pick); performSearch(pick, selectedState); }}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-lg text-slate-300 hover:text-emerald-300 transition"
            >
              {pick}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div>
            {loading ? (
              <span>Searching official records...</span>
            ) : query ? (
              <span>
                Found <strong className="text-emerald-400 font-mono">{totalMatches.toLocaleString()}</strong> verified matching companies
              </span>
            ) : (
              <span>
                Featured Top Verified Employers in South India ({companies.length} shown)
              </span>
            )}
          </div>
          {selectedState !== 'All' && (
            <span className="text-emerald-400 font-medium">Filtering: {selectedState}</span>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-400">Scanning 7.99 Lakh MCA South Indian company records...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/50 border border-slate-800 rounded-2xl p-8 space-y-3">
            <div className="text-4xl">🔍</div>
            <h3 className="text-base font-bold text-slate-200">No matching registered companies found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              We could not find a Government MCA registry match for &quot;{query}&quot; in {selectedState}. 
              If a job recruiter claims to represent this company, exercise high caution as it may be an unverified or shell entity.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((comp, idx) => (
              <div
                key={comp.cin || idx}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 sm:p-5 transition hover:shadow-lg hover:shadow-emerald-500/5 flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition line-clamp-2">
                      {comp.company_name}
                    </h3>
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                      ✓ MCA Registered
                    </span>
                  </div>

                  {/* CIN & State details */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-md border text-[11px] font-medium ${getStateBadgeStyle(comp.state)}`}>
                      📍 {comp.state}
                    </span>

                    <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                      Status: <strong className="text-emerald-400">{comp.status || 'Active'}</strong>
                    </span>
                  </div>

                  {/* CIN with copy button */}
                  {comp.cin && comp.cin !== 'N/A' && (
                    <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 rounded-lg px-3 py-1.5 text-xs">
                      <span className="text-slate-400 font-mono text-[11px]">CIN: {comp.cin}</span>
                      <button
                        onClick={() => handleCopyCin(comp.cin)}
                        className="text-slate-400 hover:text-emerald-400 text-[11px] transition"
                        title="Copy CIN"
                      >
                        {copiedCin === comp.cin ? '✓ Copied' : '📋 Copy'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Action Button */}
                {onSelectCompany && (
                  <button
                    onClick={() => onSelectCompany(comp.company_name, comp.cin)}
                    className="w-full mt-2 py-2 px-3 bg-slate-800/80 hover:bg-emerald-600 hover:text-slate-950 text-slate-300 border border-slate-700/80 hover:border-emerald-400 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <span>🎯 Verify a Job Posting for this Company</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SafeCompanyExplorer;