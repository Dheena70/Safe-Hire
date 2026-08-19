import React, { useState } from 'react';
import { predictJob, PredictionRequest, PredictionResponse, describeApiError } from '../services/api';
import bgImage from '../assets/safe-hire-bg.png';

const VerificationForm: React.FC = () => {
  const [formData, setFormData] = useState<PredictionRequest>({
    company_name: '',
    title: '',
    description: '',
    email: '',
    website: '',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const MAX_DESCRIPTION_LENGTH = 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Enforce character limit for description
    if (name === 'description' && value.length > MAX_DESCRIPTION_LENGTH) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
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
      // Hide notification after 5 seconds
      setTimeout(() => setShowNotification(false), 5000);
    } catch (err: any) {
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High':
        return 'text-red-600 bg-red-100 border-red-300';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'Low':
        return 'text-green-600 bg-green-100 border-green-300';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getPredictionIcon = (prediction: string) => {
    return prediction === 'FAKE' ? '❌' : '✅';
  };

  const getPredictionColor = (prediction: string) => {
    return prediction === 'FAKE' ? 'text-red-600' : 'text-green-600';
  };

  return (
    <div
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className="bg-green-100 border-l-4 border-green-600 text-green-800 p-4 rounded shadow-lg max-w-md">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <p className="font-bold">Verification Complete!</p>
                <p className="text-sm">Company has been verified and saved.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8 drop-shadow-lg">
          <h1 className="text-5xl font-extrabold text-white mb-2 drop-shadow-md">SAFE HIRE</h1>
          <p className="text-xl text-white drop-shadow-md">Fake Company & Job Detection System</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
            🔍 Verify Company/Job
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Name */}
            <div>
              <label htmlFor="company_name" className="block text-sm font-semibold text-gray-800 mb-2">
                Company Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                required
                value={formData.company_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                placeholder="e.g., Microsoft India Pvt Ltd"
              />
            </div>

            {/* Job Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-800 mb-2">
                Job Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                placeholder="e.g., Software Development Intern"
              />
            </div>

            {/* Job Description with Character Counter */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="description" className="block text-sm font-semibold text-gray-800">
                  Job Description <span className="text-red-600">*</span>
                </label>
                <span className={`text-sm font-medium ${
                  formData.description.length >= MAX_DESCRIPTION_LENGTH - 10
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}>
                  {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
              <textarea
                id="description"
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition resize-none"
                placeholder="Enter the complete job description (max 100 characters)"
              />
              <p className="text-xs text-gray-500 mt-1">
                📝 Limit: {MAX_DESCRIPTION_LENGTH} characters. {MAX_DESCRIPTION_LENGTH - formData.description.length} remaining.
              </p>
            </div>

            {/* Contact Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
                Contact Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                placeholder="e.g., careers@microsoft.com"
              />
            </div>

            {/* Company Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-semibold text-gray-800 mb-2">
                Company Website <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="website"
                name="website"
                required
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                placeholder="e.g., https://careers.microsoft.com"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                '🔍 Verify Company'
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border-l-4 border-red-600 text-red-800 p-4 rounded">
                <p className="font-bold">❌ Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Verification Result */}
        {result && (
          <div className="mt-8 bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-white/20 animate-fade-in">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">📊 Verification Result</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Main Result Card */}
              <div className={`p-6 rounded-xl border-2 ${result.prediction === 'FAKE' ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
                <p className="text-gray-600 text-sm font-semibold mb-2">Company Status</p>
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold text-gray-900">{formData.company_name}</h4>
                  <span className={`text-5xl ${getPredictionColor(result.prediction)}`}>
                    {getPredictionIcon(result.prediction)}
                  </span>
                </div>
                <p className={`text-2xl font-extrabold mt-4 ${getPredictionColor(result.prediction)}`}>
                  {result.prediction}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-4 rounded-xl border border-blue-300">
                  <p className="text-gray-700 text-sm font-semibold">Confidence Score</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{(result.probability * 100)?.toFixed(1)}%</p>
                </div>
                <div className={`p-4 rounded-xl border-2 ${getRiskColor(result.risk_level)}`}>
                  <p className="text-sm font-semibold">Risk Level</p>
                  <p className="text-2xl font-bold mt-1">{result.risk_level}</p>
                </div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mt-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">🔎 Analysis Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Suspicious Score:</p>
                  <p className="text-gray-900 font-bold">{result.suspicious_score}/10</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Verification Status:</p>
                  <p className="text-gray-900 font-bold">{result.verification_status}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Scam Database:</p>
                  <p className="text-gray-900 font-bold">{result.scam_status}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => {
                  setResult(null);
                  setFormData({ company_name: '', title: '', description: '', email: '', website: '' });
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                Verify Another
              </button>
              <button
                onClick={() => alert(`Company "${formData.company_name}" verification saved!`)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                Save Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationForm;
