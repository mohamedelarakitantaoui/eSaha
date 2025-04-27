// SettingsPage.tsx
import React from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import UserSettings from '../components/UserSettings';

const SettingsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <UserSettings />
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
