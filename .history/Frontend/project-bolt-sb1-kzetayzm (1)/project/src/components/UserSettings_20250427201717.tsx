import React, { useState, useEffect } from 'react';
import {
  Save,
  User,
  Bell,
  Shield,
  MapPin,
  Gift,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import useAuth from '../contexts/useAuth';
import API from '../services/api';
import LocationSettings from './LocationSettings';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  location?: string;
  notification_preferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  language?: string;
  timezone?: string;
  theme?: 'light' | 'dark' | 'system';
}

interface NotificationPreferences {
  mood_reminders: boolean;
  appointment_reminders: boolean;
  check_in_reminders: boolean;
  mood_insights: boolean;
  resource_recommendations: boolean;
}

const UserSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState;
  'profile' | 'notifications' | 'privacy' | ('account' > 'profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notificationPrefs, setNotificationPrefs] =
    useState<NotificationPreferences>({
      mood_reminders: true,
      appointment_reminders: true,
      check_in_reminders: true,
      mood_insights: true,
      resource_recommendations: true,
    });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { user, getToken, signOut } = useAuth();

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  useEffect(() => {
    fetchUserProfile();
    fetchNotificationPreferences();
  }, [getToken]); // Add getToken to dependencies

  const fetchUserProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const profileData = await API.profile.getProfile(token);
      setProfile(profileData);

      // Initialize form state
      setFullName(profileData.full_name || '');
      setPhone(profileData.phone || '');
      setDateOfBirth(profileData.date_of_birth || '');
      setGender(profileData.gender || '');
      setLanguage(profileData.language || 'en');
      setTimezone(
        profileData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      );
      setTheme(profileData.theme || 'light');
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile');

      // Set default values
      setFullName(user?.email?.split('@')[0] || '');
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotificationPreferences = async () => {
    setIsLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const prefsData = await API.profile.getNotificationPreferences(token);
      setNotificationPrefs(prefsData);
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
      // Keep default values
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const updatedProfile = {
        full_name: fullName,
        phone,
        date_of_birth: dateOfBirth,
        gender,
        language,
        timezone,
        theme,
      };

      const result = await API.profile.updateProfile(token, updatedProfile);
      setProfile((prev) => (prev ? { ...prev, ...updatedProfile } : null));
      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      await API.profile.updateNotificationPreferences(token, notificationPrefs);
      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      setError('Failed to update notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== user?.email) {
      setError(
        'Please enter your email address correctly to confirm account deletion'
      );
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      await API.profile.deleteAccount(token);

      // Sign out the user
      await signOut();

      // Redirect to landing page
      window.location.href = '/';
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account');
      setIsSaving(false);
    }
  };

  const renderProfileTab = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />

            <Input
              label="Email Address"
              value={user?.email || ''}
              disabled
              placeholder="Your email"
            />

            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />

            <Input
              label="Date of Birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Location Settings
          </h3>
          <LocationSettings onClose={() => fetchUserProfile()} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Preferences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese (Simplified)</option>
                <option value="ar">Arabic</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Time Zone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Theme
              </label>
              <select
                value={theme}
                onChange={(e) =>
                  setTheme(e.target.value as 'light' | 'dark' | 'system')
                }
                className="w-full px-3 py-2 border rounded-lg shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
                <option value="system">System Preference</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg">{error}</div>
        )}

        {saveSuccess && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg">
            Profile updated successfully!
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSaveProfile}
            className="flex items-center gap-2"
            isLoading={isSaving}
          >
            <Save size={16} />
            <span>Save Changes</span>
          </Button>
        </div>
      </div>
    );
  };

  const renderNotificationsTab = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Notification Preferences
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">
                  Mood Tracking Reminders
                </p>
                <p className="text-sm text-gray-500">
                  Daily reminders to track your mood
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="mood-reminders"
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  checked={notificationPrefs.mood_reminders}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      mood_reminders: e.target.checked,
                    })
                  }
                />
                <label
                  htmlFor="mood-reminders"
                  className="ml-2 text-sm text-gray-700 sr-only"
                >
                  Mood tracking reminders
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4"></div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">
                  Appointment Reminders
                </p>
                <p className="text-sm text-gray-500">
                  Notifications about upcoming appointments
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="appointment-reminders"
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  checked={notificationPrefs.appointment_reminders}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      appointment_reminders: e.target.checked,
                    })
                  }
                />
                <label
                  htmlFor="appointment-reminders"
                  className="ml-2 text-sm text-gray-700 sr-only"
                >
                  Appointment reminders
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4"></div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Check-in Reminders</p>
                <p className="text-sm text-gray-500">
                  Regular check-ins on your progress
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="checkin-reminders"
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  checked={notificationPrefs.check_in_reminders}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      check_in_reminders: e.target.checked,
                    })
                  }
                />
                <label
                  htmlFor="checkin-reminders"
                  className="ml-2 text-sm text-gray-700 sr-only"
                >
                  Check-in reminders
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4"></div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Mood Insights</p>
                <p className="text-sm text-gray-500">
                  Weekly insights about your emotional patterns
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="mood-insights"
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  checked={notificationPrefs.mood_insights}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      mood_insights: e.target.checked,
                    })
                  }
                />
                <label
                  htmlFor="mood-insights"
                  className="ml-2 text-sm text-gray-700 sr-only"
                >
                  Mood insights
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4"></div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">
                  Resource Recommendations
                </p>
                <p className="text-sm text-gray-500">
                  Personalized mental health resources
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="resource-recommendations"
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  checked={notificationPrefs.resource_recommendations}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      resource_recommendations: e.target.checked,
                    })
                  }
                />
                <label
                  htmlFor="resource-recommendations"
                  className="ml-2 text-sm text-gray-700 sr-only"
                >
                  Resource recommendations
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Notification Channels
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Email Notifications</p>
                <p className="text-sm text-gray-500">
                  Receive notifications via email
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="email-notifications"
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  checked={profile?.notification_preferences?.email ?? true}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev
                        ? {
                            ...prev,
                            notification_preferences: {
                              ...prev.notification_preferences,
                              email: e.target.checked,
                            } as {
                              email: boolean;
                              sms: boolean;
                              push: boolean;
                            },
                          }
                        : null
                    )
                  }
                />
                <label
                  htmlFor="email-notifications"
                  className="ml-2 text-sm text-gray-700 sr-only"
                >
                  Email notifications
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4"></div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">SMS Notifications</p>
                <p className="text-sm text-gray-500">
                  Receive notifications via text message
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sms-notifications"
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  checked={profile?.notification_preferences?.sms ?? false}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev
                        ? {
                            ...prev,
                            notification_preferences: {
                              ...prev.notification_preferences,
                              sms: e.target.checked,
                            } as {
                              email: boolean;
                              sms: boolean;
                              push: boolean;
                            },
                          }
                        : null
                    )
                  }
                />
                <label
                  htmlFor="sms-notifications"
                  className="ml-2 text-sm text-gray-700 sr-only"
                >
                  SMS notifications
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4"></div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Push Notifications</p>
                <p className="text-sm text-gray-500">
                  Receive notifications in your browser
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="push-notifications"
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  checked={profile?.notification_preferences?.push ?? true}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev
                        ? {
                            ...prev,
                            notification_preferences: {
                              ...prev.notification_preferences,
                              push: e.target.checked,
                            } as {
                              email: boolean;
                              sms: boolean;
                              push: boolean;
                            },
                          }
                        : null
                    )
                  }
                />
                <label
                  htmlFor="push-notifications"
                  className="ml-2 text-sm text-gray-700 sr-only"
                >
                  Push notifications
                </label>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg">{error}</div>
        )}

        {saveSuccess && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg">
            Notification preferences updated successfully!
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSaveNotifications}
            className="flex items-center gap-2"
            isLoading={isSaving}
          >
            <Save size={16} />
            <span>Save Preferences</span>
          </Button>
        </div>
      </div>
    );
  };

  const renderPrivacyTab = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Privacy Settings
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Data Collection</p>
                <p className="text-sm text-gray-500">
                  Allow us to analyze your usage to improve the app
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="data-collection"
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  defaultChecked={true}
                />
                <label
                  htmlFor="data-collection"
                  className="ml-2 text-sm text-gray-700 sr-only"
                >
                  Data collection
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4"></div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">
                  Share Anonymous Data
                </p>
                <p className="text-sm text-gray-500">
                  Contribute anonymous data for mental health research
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="share-data"
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  defaultChecked={false}
                />
                <label
                  htmlFor="share-data"
                  className="ml-2 text-sm text-gray-700 sr-only"
                >
                  Share anonymous data
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Data Controls
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Download Your Data</p>
                <p className="text-sm text-gray-500">
                  Export all your data in a downloadable format
                </p>
              </div>
              <Button variant="secondary" className="text-sm py-1.5">
                Download Data
              </Button>
            </div>

            <div className="border-t border-gray-200 pt-4"></div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Clear Chat History</p>
                <p className="text-sm text-gray-500">
                  Delete all your chat conversations
                </p>
              </div>
              <Button variant="secondary" className="text-sm py-1.5">
                Clear History
              </Button>
            </div>

            <div className="border-t border-gray-200 pt-4"></div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Clear Mood Data</p>
                <p className="text-sm text-gray-500">
                  Delete all your mood tracking information
                </p>
              </div>
              <Button variant="secondary" className="text-sm py-1.5">
                Clear Mood Data
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAccountTab = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Account Management
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Change Password</p>
                <p className="text-sm text-gray-500">
                  Update your account password
                </p>
              </div>
              <Button variant="secondary" className="text-sm py-1.5">
                Change Password
              </Button>
            </div>

            <div className="border-t border-gray-200 pt-4"></div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Account Type</p>
                <p className="text-sm text-gray-500">Your current plan</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="py-1 px-2 bg-gray-100 text-xs font-medium rounded-full">
                  Free Plan
                </span>
                <Button className="text-sm py-1.5 px-3">
                  <Gift size={14} className="mr-1" />
                  Upgrade
                </Button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4"></div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Sign Out</p>
                <p className="text-sm text-gray-500">Log out of your account</p>
              </div>
              <Button
                variant="secondary"
                className="text-sm py-1.5"
                onClick={signOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2 flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            Danger Zone
          </h3>

          <p className="text-sm text-red-600 mb-4">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>

          {showDeleteAccount ? (
            <div className="space-y-4">
              <p className="text-sm text-red-700 font-medium">
                To confirm, please type your email address: {user?.email}
              </p>

              <Input
                label=""
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Enter your email"
              />

              <div className="flex space-x-3">
                <Button
                  className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
                  onClick={handleDeleteAccount}
                  isLoading={isSaving}
                >
                  <Trash2 size={16} />
                  <span>Confirm Deletion</span>
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteAccount(false);
                    setDeleteConfirmation('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => setShowDeleteAccount(true)}
            >
              Delete Account
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Settings</h2>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full sm:w-64 bg-white rounded-lg shadow-md p-4">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'profile'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User
                size={18}
                className={`mr-3 ${
                  activeTab === 'profile' ? 'text-indigo-500' : 'text-gray-400'
                }`}
              />
              Profile
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'notifications'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Bell
                size={18}
                className={`mr-3 ${
                  activeTab === 'notifications'
                    ? 'text-indigo-500'
                    : 'text-gray-400'
                }`}
              />
              Notifications
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'privacy'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Shield
                size={18}
                className={`mr-3 ${
                  activeTab === 'privacy' ? 'text-indigo-500' : 'text-gray-400'
                }`}
              />
              Privacy & Data
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'account'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User
                size={18}
                className={`mr-3 ${
                  activeTab === 'account' ? 'text-indigo-500' : 'text-gray-400'
                }`}
              />
              Account
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'profile' && renderProfileTab()}
              {activeTab === 'notifications' && renderNotificationsTab()}
              {activeTab === 'privacy' && renderPrivacyTab()}
              {activeTab === 'account' && renderAccountTab()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
