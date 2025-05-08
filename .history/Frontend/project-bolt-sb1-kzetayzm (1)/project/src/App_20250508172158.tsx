import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import JournalPage from './pages/JournalPage';
import SpecialistsPage from './pages/SpecialistsPage';
import ResourcesPage from './pages/ResourcesPage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPasswordPage from './pages/ForgotPassword';
import SpecialistDetail from './components/SpecialistDetail';

// If SpecialistDetail is being rendered directly in App.tsx, we must handle it appropriately
// Method 1: Create a wrapper component that provides the required props
const SpecialistDetailPage: React.FC = () => {
  // Get specialistId from URL or other source
  // This is just an example, adapt based on your routing
  const specialistId = '1'; // Default value or get from URL params
  const handleBack = () => {
    // Navigate back to specialists page
    window.history.back();
  };

  return <SpecialistDetail specialistId={specialistId} onBack={handleBack} />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:sessionId"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/journal"
            element={
              <ProtectedRoute>
                <JournalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialists"
            element={
              <ProtectedRoute>
                <SpecialistsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialists/:id"
            element={
              <ProtectedRoute>
                <SpecialistDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources"
            element={
              <ProtectedRoute>
                <ResourcesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
