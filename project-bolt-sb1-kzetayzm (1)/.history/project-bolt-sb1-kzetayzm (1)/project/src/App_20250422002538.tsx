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

// Placeholder components for new routes
const JournalPage = () => <div>Journal Page Coming Soon</div>;
const MoodTrackerPage = () => <div>Mood Tracker Coming Soon</div>;
const CopingToolsPage = () => <div>Coping Tools Coming Soon</div>;
const HelpPage = () => <div>Help & Support Coming Soon</div>;
const SettingsPage = () => <div>Settings Coming Soon</div>;

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard Routes */}
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/new" element={<ChatPage />} />
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
