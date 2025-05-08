import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  MessageSquare,
  AlertCircle,
  Users,
  Clock,
  ChevronRight,
  Star,
} from 'lucide-react';
import { Button } from './Button';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../contexts/useAuth';
import API from '../services/api';
import PanicButton from './PanicButton';

interface Specialist {
  id: string;
  name: string;
  profession: string;
  specialties: string[];
  rating: number;
  availability: 'Available' | 'Busy' | 'Away';
  description: string;
  nextAvailable: string;
  price: string;
  imageUrl?: string;
}

// Mock data for specialists
const mockSpecialists: Specialist[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    profession: 'Clinical Psychologist',
    specialties: ['Anxiety', 'Depression', 'Trauma'],
    rating: 4.9,
    availability: 'Available',
    description:
      'Specialized in cognitive behavioral therapy for anxiety, depression, and trauma with a focus on healing.',
    nextAvailable: 'Today, 2:00 PM',
    price: '$250/hour',
  },
  {
    id: '2',
    name: 'Dr. James Wilson',
    profession: 'Clinical Psychologist',
    specialties: ['Psychology', 'Anxiety Treatment', 'Depression'],
    rating: 4.7,
    availability: 'Available',
    description:
      'Specialized in cognitive behavioral therapy for anxiety, depression, and trauma with a focus on mental growth.',
    nextAvailable: 'Today, 4:00 PM',
    price: '$180/hour',
  },
  {
    id: '3',
    name: 'Michael Williams, CPA',
    profession: 'Financial Advisor',
    specialties: ['Financial Planning', 'Tax Advisory', 'Retirement Planning'],
    rating: 4.8,
    availability: 'Busy',
    description:
      'Expert in personal finance, retirement planning, and tax optimization strategies for individuals and small businesses.',
    nextAvailable: 'Tomorrow, 10:00 AM',
    price: '$200/hour',
  },
];

interface UpcomingAppointment {
  id: string;
  title: string;
  date: string;
  start_time: string;
  type: string;
  status: string;
}

const MainDashboard: React.FC = () => {
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    UpcomingAppointment[]
  >([]);
  const [recentChats, setRecentChats] = useState<
    Array<{
      _id: string;
      session_id: string;
      title: string;
      updated_at: string;
      message_count: number;
    }>
  >([]);
  const [specialists] = useState<Specialist[]>(mockSpecialists);
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
      const [appointmentsPromise, profilePromise, chatPromise] =
        await Promise.allSettled([
          API.appointments.getAllAppointments(token),
          API.profile.getProfile(token),
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
          {/* Quick Actions - Sophisticated Styling */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-xl shadow-md p-6 flex flex-col transition-all hover:shadow-lg">
              <h3 className="text-xl font-medium mb-2">Talk to eSaha</h3>
              <p className="text-blue-50 mb-4">
                Share your thoughts or get support anytime
              </p>
              <Button
                className="mt-auto bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 border border-white/20"
                onClick={() => navigate('/chat/new')}
              >
                Start a Conversation
              </Button>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl shadow-md p-6 flex flex-col transition-all hover:shadow-lg">
              <h3 className="text-xl font-medium mb-2">Find a Specialist</h3>
              <p className="text-emerald-50 mb-4">
                Connect with qualified mental health professionals
              </p>
              <Button
                className="mt-auto bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 border border-white/20"
                onClick={() => navigate('/resources')}
              >
                Browse Specialists
              </Button>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-md p-6 flex flex-col transition-all hover:shadow-lg">
              <h3 className="text-xl font-medium mb-2">Schedule Session</h3>
              <p className="text-amber-50 mb-4">
                Book a therapy session or check-in
              </p>
              <Button
                className="mt-auto bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 border border-white/20"
                onClick={() => navigate('/appointments')}
              >
                Manage Appointments
              </Button>
            </div>
          </div>

          {/* Specialists Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-800">
                Recommended Specialists
              </h2>
              <Link
                to="/resources"
                className="text-indigo-600 text-sm flex items-center"
              >
                View All <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {specialists.map((specialist) => (
                <div key={specialist.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {specialist.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {specialist.profession}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Star className="text-yellow-400 h-4 w-4" />
                      <span className="text-sm font-medium ml-1">
                        {specialist.rating}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {specialist.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                      {specialist.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-xs text-gray-500 flex items-center">
                      <Clock size={12} className="mr-1" />
                      {specialist.nextAvailable}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        specialist.availability === 'Available'
                          ? 'bg-green-100 text-green-800'
                          : specialist.availability === 'Busy'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {specialist.availability}
                    </span>
                  </div>

                  <Button
                    className="w-full mt-3 text-sm py-1.5"
                    onClick={() =>
                      navigate(`/resources?specialist=${specialist.id}`)
                    }
                  >
                    Book Consultation
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Cards Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                <Link to="/appointments">
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
