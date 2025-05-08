import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Star,
  Clock,
  Calendar,
  MessageSquare,
  Info,
} from 'lucide-react';
import API from '../api'; // Import API service
import { Appointment, ChatSession } from '../types';
import useAuth from '../contexts/useAuth';

// Specialists data based on screenshot
const specialists = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    title: 'Clinical Psychologist',
    specialties: ['Anxiety', 'Depression', 'Trauma'],
    description:
      'Specialized in cognitive behavioral therapy for anxiety, depression, and trauma with a focus on healing.',
    availability: 'Available',
    nextAvailable: 'Today, 2:00 PM',
    rating: 4.9,
    reviews: 98,
    price: '$250/hour',
    imageUrl: '/api/placeholder/300/300',
  },
  {
    id: '2',
    name: 'Dr. James Wilson',
    title: 'Clinical Psychologist',
    specialties: ['Psychology', 'Anxiety Treatment', 'Depression'],
    description:
      'Specialized in cognitive behavioral therapy for anxiety, depression, and trauma with a focus on mental growth.',
    availability: 'Available',
    nextAvailable: 'Today, 4:00 PM',
    rating: 4.7,
    reviews: 86,
    price: '$180/hour',
    imageUrl: '/api/placeholder/300/300',
  },
  {
    id: '3',
    name: 'Michael Williams, CPA',
    title: 'Financial Advisor',
    location: 'Chicago, IL',
    specialties: ['Financial Planning', 'Tax Advisory', 'Retirement Planning'],
    description:
      'Expert in personal finance, retirement planning, and tax optimization strategies for individuals and small businesses.',
    availability: 'Busy',
    nextAvailable: 'Tomorrow, 10:00 AM',
    rating: 4.8,
    reviews: 98,
    price: '$200/hour',
    phone: '(312) 555-0456',
    email: 'michael@williamsfinancial.com',
    website: 'www.williamsfinancial.com',
    imageUrl: '/api/placeholder/300/300',
  },
];

const MainDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState({
    appointments: true,
    chatSessions: true,
  });

  useEffect(() => {
    if (accessToken) {
      // Fetch appointments
      const fetchAppointments = async () => {
        try {
          const data = await API.appointments.getAllAppointments(accessToken);
          setAppointments(data);
        } catch (error) {
          console.error('Failed to fetch appointments:', error);
        } finally {
          setLoading((prev) => ({ ...prev, appointments: false }));
        }
      };

      // Fetch chat sessions
      const fetchChatSessions = async () => {
        try {
          const data = await API.chat.getSessions(accessToken);
          setChatSessions(data);
        } catch (error) {
          console.error('Failed to fetch chat sessions:', error);
        } finally {
          setLoading((prev) => ({ ...prev, chatSessions: false }));
        }
      };

      fetchAppointments();
      fetchChatSessions();
    }
  }, [accessToken]);

  // Navigate to the specialists page
  const handleBrowseSpecialists = () => {
    navigate('/specialists');
  };

  // Navigate to chat session
  const handleChatSession = (sessionId: string) => {
    navigate(`/chat/${sessionId}`);
  };

  // Navigate to new chat
  const handleNewChat = () => {
    navigate('/chat/new');
  };

  // Get upcoming appointments only (assuming date field is a string in ISO format)
  const upcomingAppointments = appointments
    .filter((app) => new Date(app.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3); // Get only the next 3 appointments

  // Get recent chat sessions
  const recentSessions = chatSessions
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 3); // Get only the 3 most recent sessions

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Find a Specialist Card - Primary Focus */}
      <div className="max-w-md mx-auto bg-emerald-600 text-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-2">Find a Specialist</h2>
        <p className="mb-6">
          Connect with qualified mental health professionals
        </p>
        <button
          onClick={handleBrowseSpecialists}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-medium py-3 rounded-md border border-emerald-400"
        >
          Browse Specialists
        </button>
      </div>

      {/* Recommended Specialists Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Recommended Specialists</h2>
          <button
            onClick={handleBrowseSpecialists}
            className="text-indigo-600 text-sm"
          >
            View All &gt;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {specialists.slice(0, 3).map((specialist) => (
            <div
              key={specialist.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="mb-2">
                <h3 className="text-lg font-medium">{specialist.name}</h3>
                <p className="text-gray-600">{specialist.title}</p>
              </div>

              <div className="mb-2 flex justify-end">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <span className="ml-1 font-medium">{specialist.rating}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {specialist.specialties.slice(0, 2).map((specialty, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-md"
                  >
                    {specialty}
                  </span>
                ))}
              </div>

              <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                {specialist.description}
              </p>

              <div className="flex items-center mb-3 text-sm">
                <Clock className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-600">
                  {specialist.nextAvailable}
                </span>
                <span
                  className={`ml-auto px-2 py-1 text-xs rounded-full ${
                    specialist.availability === 'Available'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {specialist.availability}
                </span>
              </div>

              <button
                onClick={handleBrowseSpecialists}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md text-center"
              >
                Book Consultation
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Appointments and Chat sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Upcoming Appointments</h2>
            <a href="/appointments" className="text-indigo-600 text-sm">
              View All &gt;
            </a>
          </div>

          {loading.appointments ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border-b border-gray-100 pb-3"
                >
                  <div className="flex items-start">
                    <div className="text-indigo-600">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="font-medium">{appointment.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(appointment.date).toLocaleDateString()} •{' '}
                        {appointment.start_time}
                      </p>
                      {appointment.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {appointment.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        appointment.status === 'scheduled'
                          ? 'bg-green-100 text-green-800'
                          : appointment.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {appointment.status.charAt(0).toUpperCase() +
                        appointment.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-600 text-center py-6">
              No upcoming appointments.
            </div>
          )}

          <div className="flex justify-center mt-4">
            <a
              href="/appointments"
              className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Schedule Appointment
            </a>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Recent Conversations</h2>
            <a href="/chat" className="text-indigo-600 text-sm">
              View All &gt;
            </a>
          </div>

          {loading.chatSessions ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div
                  key={session._id}
                  className="border-b border-gray-100 pb-3 cursor-pointer"
                  onClick={() => handleChatSession(session.session_id)}
                >
                  <div className="flex items-start">
                    <div className="text-indigo-600">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">{session.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.updated_at).toLocaleDateString()} •{' '}
                        {session.message_count} messages
                      </p>
                      {session.preview && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                          {session.preview}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-600 text-center py-6">
              No conversations yet.
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button
              onClick={handleNewChat}
              className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded"
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              New Conversation
            </button>
          </div>
        </div>
      </div>

      {/* Wellness Tip */}
      <div className="mt-6 bg-blue-50 rounded-lg p-6">
        <div className="flex items-start">
          <div className="mr-4 mt-1 text-blue-600">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-medium text-blue-800 mb-1">Wellness Tip</h3>
            <p className="text-blue-700">
              Take a few moments today for deep breathing. Inhale for 4 seconds,
              hold for 4 seconds, and exhale for 6 seconds. This simple practice
              can help reduce stress and anxiety.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
