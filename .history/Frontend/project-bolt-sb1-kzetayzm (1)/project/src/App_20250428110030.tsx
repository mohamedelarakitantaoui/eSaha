import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import useAuth from './contexts/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatPage from './pages/ChatPage';
import ChatSessionsPage from './components/ChatSessionsPage';
import { DashboardLayout } from './components/DashboardLayout';

import JournalPage from './pages/JournalPage';
import MoodTrackerPage from './components/MoodTrackerPage';
import ResourcesPage from './pages/ResourcesPage';
import SettingsPage from './pages/SettingsPage';
import MainDashboard from './components/MainDashboard';
import EmergencyContacts from './components/EmergencyContacts';
import SchedulingCalendar from './components/SchedulingCalendar';

// Placeholder components for routes not yet implemented
const CopingToolsPage = () => (
  <DashboardLayout>
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Coping Tools</h2>
        <p className="text-gray-600">This feature is coming soon!</p>
      </div>
    </div>
  </DashboardLayout>
);

const HelpPage = () => (
  <DashboardLayout>
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Help & Support
        </h2>
        <p className="text-gray-600">This feature is coming soon!</p>
      </div>
    </div>
  </DashboardLayout>
);

// Temporary placeholder component for MoodTrackerDashboard if it doesn't exist yet
const MoodTrackerDashboard = () => (
  <div className="text-center">
    <h2 className="text-2xl font-bold text-gray-800 mb-2">Mood Dashboard</h2>
    <p className="text-gray-600">The enhanced mood tracker is coming soon!</p>
    <p className="text-gray-600 mt-4">
      Using temporary placeholder until component is implemented.
    </p>
  </div>
);

// Authentication check wrapper component
const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated, but save the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Auth routes component to prevent authenticated users from accessing login/register
const AuthRoutes = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state, or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (!loading && user) {
      // Redirect to the page they tried to visit or dashboard if already logged in
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If not logged in, show the auth page (login/register)
  return !user ? children : null;
};

// Root component to handle initial routing
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated, otherwise to dashboard
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes - prevent access if already logged in */}
          <Route
            path="/login"
            element={
              <AuthRoutes>
                <Login />
              </AuthRoutes>
            }
          />
          <Route
            path="/register"
            element={
              <AuthRoutes>
                <Register />
              </AuthRoutes>
            }
          />

          {/* Protected Dashboard Routes - require authentication */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardLayout>
                  <div className="p-6">
                    <MainDashboard />
                  </div>
                </DashboardLayout>
              </RequireAuth>
            }
          />

          {/* Chat Routes */}
          <Route
            path="/chat"
            element={
              <RequireAuth>
                <ChatSessionsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/chat/new"
            element={
              <RequireAuth>
                <ChatPage />
              </RequireAuth>
            }
          />
          <Route
            path="/chat/:sessionId"
            element={
              <RequireAuth>
                <ChatPage />
              </RequireAuth>
            }
          />

          {/* Journal Routes */}
          <Route
            path="/journal"
            element={
              <RequireAuth>
                <JournalPage />
              </RequireAuth>
            }
          />

          {/* Mood Tracker Routes */}
          <Route
            path="/mood"
            element={
              <RequireAuth>
                <DashboardLayout>
                  <div className="p-6">
                    <MoodTrackerDashboard />
                  </div>
                </DashboardLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/mood/old"
            element={
              <RequireAuth>
                <MoodTrackerPage />
              </RequireAuth>
            }
          />

          {/* Appointment Routes */}
          <Route
            path="/appointments"
            element={
              <RequireAuth>
                <DashboardLayout>
                  <div className="p-6">
                    <SchedulingCalendar />
                  </div>
                </DashboardLayout>
              </RequireAuth>
            }
          />

          {/* Emergency Contacts Routes */}
          <Route
            path="/emergency-contacts"
            element={
              <RequireAuth>
                <DashboardLayout>
                  <div className="p-6">
                    <EmergencyContacts />
                  </div>
                </DashboardLayout>
              </RequireAuth>
            }
          />

          {/* Resources Routes */}
          <Route
            path="/resources"
            element={
              <RequireAuth>
                <ResourcesPage />
              </RequireAuth>
            }
          />

          {/* Settings Routes */}
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            }
          />

          {/* Other Routes */}
          <Route
            path="/tools"
            element={
              <RequireAuth>
                <CopingToolsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/help"
            element={
              <RequireAuth>
                <HelpPage />
              </RequireAuth>
            }
          />

          {/* Root path redirects to login or dashboard based on auth state */}
          <Route path="/" element={<RootRedirect />} />

          {/* Catch all other routes and redirect appropriately */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
