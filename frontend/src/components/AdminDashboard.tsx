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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border-l-4 border-red-600 text-red-800 p-6 rounded max-w-md">
          <p className="font-bold text-lg mb-2">❌ Error Loading Dashboard</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  // Safe defaults - Use the actual property names from backend
  const totalPredictions = analytics.total_predictions ?? 0;
  const realCount = (analytics as any).predictions_summary?.REAL ?? 0;
  const fakeCount = (analytics as any).predictions_summary?.FAKE ?? 0;
  const riskDist = analytics.risk_distribution ?? { high: 0, medium: 0, low: 0 };

  const riskPercent = (count: number) =>
    totalPredictions > 0 ? ((count / totalPredictions) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📊 Admin Dashboard</h1>
          <p className="text-gray-400">Real-time fraud detection analytics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Predictions */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-semibold">Total Verifications</p>
                <p className="text-4xl font-bold mt-2">{totalPredictions}</p>
              </div>
              <div className="text-5xl opacity-20">📈</div>
            </div>
          </div>

          {/* Real Listings */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-semibold">✅ Real Listings</p>
                <p className="text-4xl font-bold mt-2">{realCount}</p>
              </div>
              <div className="text-5xl opacity-20">✓</div>
            </div>
          </div>

          {/* Fake Listings */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-semibold">❌ Fake Listings</p>
                <p className="text-4xl font-bold mt-2">{fakeCount}</p>
              </div>
              <div className="text-5xl opacity-20">✕</div>
            </div>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-xl p-8 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Risk Level Distribution</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* High Risk */}
            <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-500">
              <p className="text-red-900 text-sm font-semibold mb-2">🔴 High Risk</p>
              <p className="text-3xl font-bold text-red-700">{riskDist.high}</p>
              <p className="text-xs text-red-600 mt-2">
                {riskPercent(riskDist.high)}% of total
              </p>
            </div>

            {/* Medium Risk */}
            <div className="bg-yellow-50 rounded-lg p-6 border-l-4 border-yellow-500">
              <p className="text-yellow-900 text-sm font-semibold mb-2">🟡 Medium Risk</p>
              <p className="text-3xl font-bold text-yellow-700">{riskDist.medium}</p>
              <p className="text-xs text-yellow-600 mt-2">
                {riskPercent(riskDist.medium)}% of total
              </p>
            </div>

            {/* Low Risk */}
            <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
              <p className="text-green-900 text-sm font-semibold mb-2">🟢 Low Risk</p>
              <p className="text-3xl font-bold text-green-700">{riskDist.low}</p>
              <p className="text-xs text-green-600 mt-2">
                {riskPercent(riskDist.low)}% of total
              </p>
            </div>
          </div>
        </div>

        {/* Risk Distribution Bar Chart */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-xl p-8 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Risk Level Breakdown</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-white">High Risk</span>
                <span className="text-sm text-gray-300">{riskDist.high} predictions</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${riskPercent(riskDist.high)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-white">Medium Risk</span>
                <span className="text-sm text-gray-300">{riskDist.medium} predictions</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${riskPercent(riskDist.medium)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-white">Low Risk</span>
                <span className="text-sm text-gray-300">{riskDist.low} predictions</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${riskPercent(riskDist.low)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        {totalPredictions === 0 && (
          <div className="bg-blue-100 border-l-4 border-blue-600 text-blue-800 p-6 rounded mb-8">
            <p className="font-bold">ℹ️ No Data Yet</p>
            <p className="text-sm mt-1">Start verifying companies to see analytics here.</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-gray-300 text-sm">Total Verified</p>
              <p className="text-3xl font-bold text-white mt-2">{totalPredictions}</p>
            </div>
            <div>
              <p className="text-gray-300 text-sm">Legitimate Rate</p>
              <p className="text-3xl font-bold text-green-400 mt-2">
                {totalPredictions > 0 ? ((realCount / totalPredictions) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div>
              <p className="text-gray-300 text-sm">Fraud Detection Rate</p>
              <p className="text-3xl font-bold text-red-400 mt-2">
                {totalPredictions > 0 ? ((fakeCount / totalPredictions) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
