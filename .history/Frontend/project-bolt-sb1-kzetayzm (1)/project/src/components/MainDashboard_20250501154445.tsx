// MainDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  BarChart2,
  MessageSquare,
  AlertCircle,
  Clock,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { Button } from './Button';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../contexts/useAuth';
import API from '../services/api';
import PanicButton from './PanicButton';

interface UpcomingAppointment {
  id: string;
  title: string;
  date: string;
  start_time: string;
  type: string;
  status: string;
}

interface MoodSummary {
  averageScore: number;
  recentTrend: 'improving' | 'declining' | 'stable';
  mostCommonMood: string;
}

// Update to match API interface
interface ChatSession {
  _id: string; // Using _id to match API response
  session_id: string;
  title: string;
  updated_at: string;
  message_count: number;
}

interface LocalResource {
  id: string;
  name: string;
  type: string;
  distance?: number;
}

const MainDashboard: React.FC = () => {
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    UpcomingAppointment[]
  >([]);
  const [moodSummary, setMoodSummary] = useState<MoodSummary | null>(null);
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [localResources, setLocalResources] = useState<LocalResource[]>([]);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, getToken } = useAuth();
  const navigate = useNavigate();

  // Use useCallback to avoid dependency issues with useEffect
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);

    try {
      const token = await getToken();
      if (!token) return;

      // Fetch all data in parallel
      const [appointmentsPromise, profilePromise, moodPromise, chatPromise] =
        await Promise.allSettled([
          API.appointments.getAllAppointments(token),
          API.profile.getProfile(token),
          API.mood.getMoodInsights(token, 'month'),
          API.chat.getSessions(token),
        ]);

      // Process appointments with proper typing
      if (appointmentsPromise.status === 'fulfilled') {
        const appointments = appointmentsPromise.value
          .filter((appt) => appt.status === 'scheduled')
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )
          .slice(0, 3);
        setUpcomingAppointments(appointments);
      }

      // Process profile to get location
      if (profilePromise.status === 'fulfilled') {
        const profile = profilePromise.value;
        setUserLocation(profile.location || null);

        // If location exists, fetch local resources
        if (profile.location) {
          try {
            const resources = await API.resources.getLocalResources(
              token,
              profile.location
            );
            setLocalResources(resources.slice(0, 3));
          } catch (err) {
            console.error('Error fetching local resources:', err);
          }
        }
      }

      // Process mood insights - handle missing properties
      if (moodPromise.status === 'fulfilled') {
        const insights = moodPromise.value;

        // Create our own derived recentTrend based on recommendations
        let derivedTrend: 'improving' | 'declining' | 'stable' = 'stable';
        const trendRecommendation = insights.recommendations.find(
          (rec) => rec.includes('improving') || rec.includes('declined')
        );

        if (trendRecommendation) {
          if (trendRecommendation.includes('improving')) {
            derivedTrend = 'improving';
          } else if (trendRecommendation.includes('declined')) {
            derivedTrend = 'declining';
          }
        }

        // Derive most common mood from distribution
        const mostCommonMood =
          Object.entries(insights.moodDistribution)
            .sort((a, b) => b[1] - a[1])
            .map((entry) => entry[0])[0] || 'neutral';

        setMoodSummary({
          averageScore: insights.averageMoodScore || 0,
          recentTrend: derivedTrend,
          mostCommonMood,
        });
      } else {
        setMoodSummary({
          averageScore: 0,
          recentTrend: 'stable',
          mostCommonMood: 'neutral',
        });
      }

      // Process chat sessions with proper typing
      if (chatPromise.status === 'fulfilled') {
        const sessions = chatPromise.value
          .sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
          )
          .slice(0, 3)
          .map((session) => ({
            _id: session._id,
            session_id: session.session_id,
            title: session.title,
            updated_at: session.updated_at,
            message_count: session.message_count,
          }));
        setRecentChats(sessions);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]); // Include getToken in the dependency array

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // Add fetchDashboardData as a dependency

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getMoodEmoji = (score: number) => {
    if (score >= 4) return '😄';
    if (score >= 2) return '🙂';
    if (score >= -1) return '😐';
    if (score >= -3) return '😔';
    return '😢';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return '↗️';
    if (trend === 'declining') return '↘️';
    return '→';
  };

  const getAppointmentIcon = (type: string) => {
    switch (type) {
      case 'therapy':
        return <Calendar className="text-indigo-600" size={18} />;
      case 'check_in':
        return <Clock className="text-green-600" size={18} />;
      case 'support_group':
        return <MessageSquare className="text-blue-600" size={18} />;
      default:
        return <Calendar className="text-gray-600" size={18} />;
    }
  };

  const userName = user?.email?.split('@')[0] || 'Friend';

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {userName}
          </h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        <div>
          <PanicButton variant="inline" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Quick Actions - UPDATED COLORS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-600 text-white rounded-lg shadow-md p-6 flex flex-col">
              <h3 className="text-lg font-medium mb-2">Talk to eSaha</h3>
              <p className="text-blue-100 mb-4">
                Share your thoughts or get support anytime
              </p>
              <Button
                className="mt-auto bg-white text-blue-600 hover:bg-blue-50 font-bold"
                onClick={() => navigate('/chat/new')}
              >
                Start a Conversation
              </Button>
            </div>

            <div className="bg-red-600 text-white rounded-lg shadow-md p-6 flex flex-col">
              <h3 className="text-lg font-medium mb-2">Track Your Mood</h3>
              <p className="text-red-100 mb-4">
                Record how you're feeling today
              </p>
              <Button
                className="mt-auto bg-white text-red-600 hover:bg-red-50 font-bold"
                onClick={() => navigate('/mood')}
              >
                Log Your Mood
              </Button>
            </div>

            <div className="bg-yellow-600 text-white rounded-lg shadow-md p-6 flex flex-col">
              <h3 className="text-lg font-medium mb-2">Schedule Session</h3>
              <p className="text-yellow-100 mb-4">
                Book a therapy session or check-in
              </p>
              <Button
                className="mt-auto bg-white text-yellow-600 hover:bg-yellow-50 font-bold"
                onClick={() => navigate('/appointments')}
              >
                Manage Appointments
              </Button>
            </div>
          </div>
          -{/* Cards Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Mood Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800">
                  Mood Summary
                </h2>
                <Link
                  to="/mood"
                  className="text-indigo-600 text-sm flex items-center"
                >
                  View Details <ChevronRight size={16} />
                </Link>
              </div>

              {moodSummary ? (
                <div className="flex items-center">
                  <div className="text-4xl mr-4">
                    {getMoodEmoji(moodSummary.averageScore)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">
                      Average Mood: {moodSummary.averageScore.toFixed(1)} / 5
                    </div>
                    <div className="text-sm text-gray-600 flex items-center">
                      {getTrendIcon(moodSummary.recentTrend)}
                      <span className="ml-1">
                        {moodSummary.recentTrend === 'improving'
                          ? 'Improving recently'
                          : moodSummary.recentTrend === 'declining'
                          ? 'Slight decline recently'
                          : 'Stable recently'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">
                  No mood data available. Start tracking your mood.
                </div>
              )}

              <div className="mt-4 flex justify-center">
                <Link to="/mood">
                  <Button
                    variant="secondary"
                    className="text-sm flex items-center"
                  >
                    <BarChart2 size={16} className="mr-1" />
                    Mood Dashboard
                  </Button>
                </Link>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800">
                  Upcoming Appointments
                </h2>
                <Link
                  to="/appointments"
                  className="text-indigo-600 text-sm flex items-center"
                >
                  View All <ChevronRight size={16} />
                </Link>
              </div>

              {upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-start">
                      <div className="mr-3 mt-1">
                        {getAppointmentIcon(appointment.type)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {appointment.title}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(appointment.date)} at{' '}
                          {appointment.start_time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">
                  No upcoming appointments.
                </div>
              )}

              <div className="mt-4 flex justify-center">
                <Link to="/appointments/new">
                  <Button
                    variant="secondary"
                    className="text-sm flex items-center"
                  >
                    <Calendar size={16} className="mr-1" />
                    Schedule Appointment
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          {/* Cards Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Conversations */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800">
                  Recent Conversations
                </h2>
                <Link
                  to="/chat"
                  className="text-indigo-600 text-sm flex items-center"
                >
                  View All <ChevronRight size={16} />
                </Link>
              </div>

              {recentChats.length > 0 ? (
                <div className="space-y-3">
                  {recentChats.map((session) => (
                    <Link
                      key={session._id}
                      to={`/chat/${session.session_id}`}
                      className="flex items-start p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="mr-3 mt-1">
                        <MessageSquare size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {session.title || 'New Chat'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(session.updated_at).toLocaleDateString()} •{' '}
                          {session.message_count} messages
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">
                  No recent conversations.
                </div>
              )}

              <div className="mt-4 flex justify-center">
                <Link to="/chat/new">
                  <Button
                    variant="secondary"
                    className="text-sm flex items-center"
                  >
                    <MessageSquare size={16} className="mr-1" />
                    New Conversation
                  </Button>
                </Link>
              </div>
            </div>

            {/* Local Resources */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800">
                  Local Resources
                </h2>
                <Link
                  to="/resources"
                  className="text-indigo-600 text-sm flex items-center"
                >
                  View All <ChevronRight size={16} />
                </Link>
              </div>

              {userLocation ? (
                <>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <MapPin size={14} className="mr-1" />
                    <span>{userLocation}</span>
                  </div>

                  {localResources.length > 0 ? (
                    <div className="space-y-3">
                      {localResources.map((resource) => (
                        <div key={resource.id} className="flex items-start">
                          <div className="mr-3 mt-1">
                            <MapPin size={18} className="text-indigo-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">
                              {resource.name}
                            </div>
                            <div className="flex items-center text-xs text-gray-600">
                              <span className="capitalize">
                                {resource.type.replace('_', ' ')}
                              </span>
                              {resource.distance && (
                                <span className="ml-2">
                                  {resource.distance} miles away
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-4">
                      No local resources found.
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-3">
                    Add your location to see mental health resources near you.
                  </p>
                  <Link to="/settings">
                    <Button
                      variant="secondary"
                      className="text-sm flex items-center mx-auto"
                    >
                      <MapPin size={16} className="mr-1" />
                      Set Location
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
          {/* Daily Tip */}
          <div className="mt-6 bg-indigo-50 rounded-lg p-6">
            <div className="flex">
              <div className="mr-4">
                <AlertCircle size={24} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium text-indigo-800 mb-1">
                  Wellness Tip
                </h3>
                <p className="text-indigo-700">
                  Take a few moments today for deep breathing. Inhale for 4
                  seconds, hold for 4 seconds, and exhale for 6 seconds. This
                  simple practice can help reduce stress and anxiety.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Floating panic button (fixed position) */}
      <PanicButton variant="fixed" />
    </div>
  );
};

export default MainDashboard;
