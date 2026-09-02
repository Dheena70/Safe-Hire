import React, { useState, useEffect } from 'react';
import { getAnalytics, AnalyticsData, describeApiError } from '../services/api';

interface AdminDashboardProps {
  token: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ token }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const data = await getAnalytics(token);
        setAnalytics(data);
      } catch (err: any) {
        setError(describeApiError(err));
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Aggregating real-time detection intelligence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl shadow-xl">
        <p className="font-bold text-base mb-1 flex items-center space-x-2">
          <span>❌</span>
          <span>Access Error</span>
        </p>
        <p className="text-xs text-rose-200">{error}</p>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const totalPredictions = analytics.total_predictions ?? 0;
  const realCount = analytics.real_predictions ?? (analytics.predictions_summary?.REAL ?? 0);
  const fakeCount = analytics.fake_predictions ?? (analytics.predictions_summary?.FAKE ?? 0);
  const riskDist = analytics.risk_distribution ?? { high: 0, medium: 0, low: 0 };
  const recentList = analytics.recent_predictions ?? [];

  const riskPercent = (count: number) =>
    totalPredictions > 0 ? ((count / totalPredictions) * 100).toFixed(1) : '0';

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
            <span>🛡️</span>
            <span>Security Operations Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Admin Intelligence Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Live monitoring of employment verification queries and fraud risk metrics</p>
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Predictions */}
        <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Verifications</p>
              <p className="text-4xl font-extrabold text-white mt-2 font-mono">{totalPredictions}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-2xl">
              📈
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-4">Cumulative queries processed by AI engine</p>
        </div>

        {/* Real Listings */}
        <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Verified Real Listings</p>
              <p className="text-4xl font-extrabold text-emerald-400 mt-2 font-mono">{realCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl">
              ✅
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-4">
            {totalPredictions > 0 ? ((realCount / totalPredictions) * 100).toFixed(1) : 0}% of all verified submissions
          </p>
        </div>

        {/* Fake Listings */}
        <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Flagged Fraudulent</p>
              <p className="text-4xl font-extrabold text-rose-400 mt-2 font-mono">{fakeCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-2xl">
              🚨
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-4">
            {totalPredictions > 0 ? ((fakeCount / totalPredictions) * 100).toFixed(1) : 0}% fraud detection rate
          </p>
        </div>
      </div>

      {/* Risk Level Distribution Cards */}
      <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <span>📊</span>
          <span>Risk Classification Distribution</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* High Risk */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-rose-500/30 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">🔴 High Risk</span>
              <span className="text-xs font-mono text-slate-400">{riskPercent(riskDist.high)}%</span>
            </div>
            <p className="text-3xl font-extrabold text-white mt-2 font-mono">{riskDist.high}</p>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: `${riskPercent(riskDist.high)}%` }} />
            </div>
          </div>

          {/* Medium Risk */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-amber-500/30 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">🟡 Medium Risk</span>
              <span className="text-xs font-mono text-slate-400">{riskPercent(riskDist.medium)}%</span>
            </div>
            <p className="text-3xl font-extrabold text-white mt-2 font-mono">{riskDist.medium}</p>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${riskPercent(riskDist.medium)}%` }} />
            </div>
          </div>

          {/* Low Risk */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-emerald-500/30 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">🟢 Low Risk</span>
              <span className="text-xs font-mono text-slate-400">{riskPercent(riskDist.low)}%</span>
            </div>
            <p className="text-3xl font-extrabold text-white mt-2 font-mono">{riskDist.low}</p>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${riskPercent(riskDist.low)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Live Recent Verifications Log Table */}
      <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <span>📋</span>
          <span>Recent Verification Stream</span>
        </h2>

        {recentList.length === 0 ? (
          <p className="text-xs text-slate-400">No verifications recorded in live memory.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">Company Name</th>
                  <th className="px-4 py-3.5">Job Title</th>
                  <th className="px-4 py-3.5">Prediction</th>
                  <th className="px-4 py-3.5">Risk Level</th>
                  <th className="px-4 py-3.5">Legitimacy Conf.</th>
                  <th className="px-4 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                {recentList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3.5 font-semibold text-white">{item.company_name}</td>
                    <td className="px-4 py-3.5 text-slate-300">{item.title}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        item.prediction === 'REAL'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                      }`}>
                        {item.prediction}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`font-semibold ${
                        item.risk_level === 'High' ? 'text-rose-400' : item.risk_level === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {item.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-cyan-400">
                      {(item.probability * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
