import React, { useState, useEffect } from 'react';
import { SafeCompany, searchSafeCompanies, getCompanyStats } from '../services/api';

interface SafeCompanyExplorerProps {
  onSelectCompany?: (companyName: string, cin?: string) => void;
}

const SOUTH_STATES = [
  { id: 'All', name: 'All South India & UTs' },
  { id: 'Tamil Nadu', name: 'Tamil Nadu' },
  { id: 'Karnataka', name: 'Karnataka (Bangalore)' },
  { id: 'Telangana', name: 'Telangana (Hyderabad)' },
  { id: 'Kerala', name: 'Kerala' },
  { id: 'Andhra Pradesh', name: 'Andhra Pradesh' },
  { id: 'Puducherry', name: 'Puducherry (UT)' },
  { id: 'Lakshadweep', name: 'Lakshadweep (UT)' },
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
    total: 799439,
    breakdown: {
      'Tamil Nadu': 228433,
      'Karnataka': 217749,
      'Telangana': 193693,
      'Kerala': 99805,
      'Andhra Pradesh': 59709,
      'Puducherry': 30,
      'Lakshadweep': 15,
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
      case 'Puducherry':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Lakshadweep':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
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
              <span>7,99,439+ Official MCA Verified Entities</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <svg className="w-7 h-7 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2"/>
                <path d="M7 7h10"/>
                <path d="M7 12h10"/>
                <path d="M7 17h10"/>
              </svg>
              <span>Verified Safe Companies Directory</span>
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Search and explore Government-registered companies across South India &amp; Union Territories (TN, KA, TG, KL, AP, PY, LD).
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
              <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>5 States + 2 UTs Covered</span>
            </div>
          </div>
        </div>

        {/* State Breakdown Pills */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
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
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
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
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/>
                  <path d="m6 6 12 12"/>
                </svg>
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
                {st.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-400 transition"
          >
            <option value="Active" className="bg-slate-900">Active Companies Only</option>
            <option value="All" className="bg-slate-900">All Registry Statuses</option>
          </select>
        </div>

        {/* Popular Quick-Search Tags */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 pt-1">
          <span className="font-semibold text-slate-300 mr-1 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Quick Picks:
          </span>
          {POPULAR_SAFE_PICKS.map((pick) => (
            <button
              key={pick}
              onClick={() => setQuery(pick)}
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
            <p className="text-sm text-slate-400">Scanning 8 Lakh MCA South Indian company records...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/50 border border-slate-800 rounded-2xl p-8 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
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
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      MCA Registered
                    </span>
                  </div>

                  {/* CIN & State details */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-md border text-[11px] font-medium flex items-center gap-1 ${getStateBadgeStyle(comp.state)}`}>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {comp.state}
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
                        className="text-slate-400 hover:text-emerald-400 text-[11px] transition flex items-center gap-1"
                        title="Copy CIN"
                      >
                        {copiedCin === comp.cin ? (
                          <>
                            <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Copied
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                            </svg>
                            Copy
                          </>
                        )}
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
                    <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 14 14"/>
                    </svg>
                    <span>Verify a Job Posting for this Company</span>
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