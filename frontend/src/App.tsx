import React, { useState } from 'react';
import { AuthResponse, getMe, getVisitorCount } from './services/api';
import AuthForm from './components/AuthForm';
import VerificationForm from './components/VerificationForm';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [visitorCount, setVisitorCount] = useState(0);

  const handleAuthSuccess = (userData: AuthResponse) => {
    setUser(userData);
    localStorage.setItem('token', userData.access_token);
  };

  const handleLogout = () => {
    setUser(null);
    setShowAdmin(false);
    localStorage.removeItem('token');
  };

  const toggleAdminView = () => {
    setShowAdmin(!showAdmin);
  };

  // Restore a session on page load by validating the stored token against
  // the backend, rather than trusting whatever was in local storage.
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCheckingSession(false);
      return;
    }

    getMe(token)
      .then((me) => {
        setUser({ access_token: token, user: me });
      })
      .catch(() => {
        // Token is invalid or expired
        localStorage.removeItem('token');
      })
      .finally(() => setCheckingSession(false));
  }, []);

  // Load visitor count on app startup
  React.useEffect(() => {
    getVisitorCount().then((count) => setVisitorCount(count));
  }, []);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  const isAdmin = user.user.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header with Visitor Counter */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-blue-600">SAFE HIRE</h1>
              <div className="text-sm text-gray-600 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
                👥 Visitors: <span className="font-bold text-blue-600">{visitorCount.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <button
                  onClick={toggleAdminView}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    showAdmin
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {showAdmin ? 'Verification' : 'Admin Dashboard'}
                </button>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Welcome, {user.user.name}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {showAdmin && isAdmin ? (
          <AdminDashboard token={user.access_token} />
        ) : (
          <VerificationForm />
        )}
      </main>
    </div>
  );
}

export default App;
