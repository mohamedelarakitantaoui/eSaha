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
import ChatSessionsPage from './pages/ChatSessionsPage'; // Import the new component
import { DashboardLayout } from './components/DashboardLayout';

import JournalPage from './pages/JournalPage';
import MoodTrackerPage from './pages/MoodTrackerPage';

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

const SettingsPage = () => (
  <DashboardLayout>
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Settings</h2>
        <p className="text-gray-600">This feature is coming soon!</p>
      </div>
    </div>
  </DashboardLayout>
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
          <Route path="/chat" element={<ChatSessionsPage />} />{' '}
          {/* Show sessions list */}
          <Route path="/chat/new" element={<ChatPage />} />{' '}
          {/* Create new session */}
          <Route path="/chat/:sessionId" element={<ChatPage />} />{' '}
          {/* Open existing session */}
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/mood" element={<MoodTrackerPage />} />
          <Route path="/tools" element={<CopingToolsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
