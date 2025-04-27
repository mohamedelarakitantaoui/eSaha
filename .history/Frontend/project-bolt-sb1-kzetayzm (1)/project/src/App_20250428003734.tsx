import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatPage from './pages/ChatPage';
import ChatSessionsPage from './components/ChatSessionsPage'; // Fixed: actually in components folder
import { DashboardLayout } from './components/DashboardLayout';

import JournalPage from './pages/JournalPage';
import MoodTrackerPage from './components/MoodTrackerPage'; // Fixed: actually in components folder
import ResourcesPage from './pages/ResourcesPage';
import SettingsPage from './pages/SettingsPage';
import MainDashboard from './components/MainDashboard';
import EmergencyContacts from './components/EmergencyContacts'; // Fixed: correct component name
import SchedulingCalendar from './components/SchedulingCalendar';
// Note: MoodTrackerDashboard needs to be created or you need to use MoodTrackerPage instead

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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <DashboardLayout>
                <div className="p-6">
                  <MainDashboard />
                </div>
              </DashboardLayout>
            }
          />

          {/* Chat Routes */}
          <Route path="/chat" element={<ChatSessionsPage />} />
          <Route path="/chat/new" element={<ChatPage />} />
          <Route path="/chat/:sessionId" element={<ChatPage />} />

          {/* Journal Routes */}
          <Route path="/journal" element={<JournalPage />} />

          {/* Mood Tracker Routes */}
          <Route
            path="/mood"
            element={
              <DashboardLayout>
                <div className="p-6">
                  <MoodTrackerDashboard />
                </div>
              </DashboardLayout>
            }
          />
          <Route path="/mood/old" element={<MoodTrackerPage />} />

          {/* Appointment Routes */}
          <Route
            path="/appointments"
            element={
              <DashboardLayout>
                <div className="p-6">
                  <SchedulingCalendar />
                </div>
              </DashboardLayout>
            }
          />

          {/* Emergency Contacts Routes */}
          <Route
            path="/emergency-contacts"
            element={
              <DashboardLayout>
                <div className="p-6">
                  <EmergencyContacts />
                </div>
              </DashboardLayout>
            }
          />

          {/* Resources Routes */}
          <Route path="/resources" element={<ResourcesPage />} />

          {/* Settings Routes */}
          <Route path="/settings" element={<SettingsPage />} />

          {/* Other Routes */}
          <Route path="/tools" element={<CopingToolsPage />} />
          <Route path="/help" element={<HelpPage />} />

          {/* Redirect root to dashboard if logged in, otherwise to login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Catch all other routes and redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
