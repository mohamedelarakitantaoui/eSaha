import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, Calendar, MessageSquare, Info } from 'lucide-react';
import API, { Appointment, ChatSession } from '../services/api'; // Import types directly from API
import useAuth from '../contexts/useAuth';

// Define interface for specialist data
interface Specialist {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  description: string;
  availability: string;
  nextAvailable: string;
  rating: number;
  reviews: number;
  price: string;
  imageUrl: string;
  location?: string;
  phone?: string;
  email?: string;
  website?: string;
}

// Specialists data using Al Akhawayn University counseling team
const specialists: Specialist[] = [
  {
    id: '1',
    name: 'Aure Veyssière',
    title: 'Assistant Professor / Counselor',
    specialties: ['Counseling', 'Academic Support', 'Stress Management'],
    description:
      'Experienced counselor specializing in helping students navigate academic challenges and personal growth.',
    availability: 'Available',
    nextAvailable: 'Today, 2:00 PM',
    rating: 4.9,
    reviews: 78,
    price: 'Free for students',
    location: 'Building 6, room 108',
    imageUrl: '/api/placeholder/300/300',
  },
  {
    id: '2',
    name: 'Imane Boukhare',
    title: 'Full-time Counselor',
    specialties: ['Anxiety', 'Depression', 'Student Wellness'],
    description:
      'Dedicated counselor focused on supporting students through personal challenges and promoting mental wellbeing.',
    availability: 'Available',
    nextAvailable: 'Today, 4:00 PM',
    rating: 4.8,
    reviews: 65,
    price: 'Free for students',
    location: 'Building 8b, room 203',
    imageUrl: '/api/placeholder/300/300',
  },
  {
    id: '3',
    name: 'Mohamed Ghali Guissi',
    title: 'Full-time Counselor',
    specialties: [
      'Career Guidance',
      'Life Transitions',
      'Personal Development',
    ],
    description:
      'Experienced counselor dedicated to helping students navigate life transitions and achieve personal growth.',
    availability: 'Busy',
    nextAvailable: 'Tomorrow, 10:00 AM',
    rating: 4.7,
    reviews: 82,
    price: 'Free for students',
    location: 'Building 8b, room 309',
    imageUrl: '/api/placeholder/300/300',
  },
  {
    id: '4',
    name: 'Prof. Jallal Toufiq',
    title: 'Part-time Psychiatrist',
    specialties: [
      'Psychiatric Assessment',
      'Medication Management',
      'Mental Health',
    ],
    description:
      'Experienced psychiatrist providing specialized mental health support for students with complex needs.',
    availability: 'Limited',
    nextAvailable: 'Thursday afternoon',
    rating: 4.9,
    reviews: 54,
    price: 'Free for students',
    location: 'Building 6, room 108',
    imageUrl: '/api/placeholder/300/300',
  },
  {
    id: '5',
    name: 'Dr. El Jarrafi',
    title: 'Part-time Psychiatrist',
    specialties: [
      'Clinical Psychiatry',
      'Crisis Intervention',
      'Mental Health Support',
    ],
    description:
      'Licensed psychiatrist offering expert mental health care and support for students facing psychological challenges.',
    availability: 'Limited',
    nextAvailable: 'Monday afternoon',
    location: 'Building 26, Health center',
    rating: 4.8,
    reviews: 46,
    price: 'Free for students',
    imageUrl: '/api/placeholder/300/300',
  },
];

const MainDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
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
          console.log(
            'Fetching appointments with token (partial):',
            accessToken.substring(0, 10) + '...'
          );
          const data = await API.appointments.getAllAppointments(accessToken);
          console.log('Received appointments:', data);
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
          console.log(
            'Fetching chat sessions with token (partial):',
            accessToken.substring(0, 10) + '...'
          );
          const data = await API.chat.getSessions(accessToken);
          console.log('Received chat sessions:', data);
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

  // Navigate to appointments page
  const handleViewAppointments = () => {
    navigate('/appointments');
  };

  // Navigate to appointment detail
  const handleViewAppointment = (appointmentId: string) => {
    navigate(`/appointments/${appointmentId}`);
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

  // Format date for display
  const formatAppointmentDate = (date: string, time: string) => {
    const appointmentDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    // Check if it's today or tomorrow
    if (appointmentDate.toDateString() === today.toDateString()) {
      return `Today, ${time}`;
    } else if (appointmentDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${time}`;
    } else {
      // Otherwise format as "Mon, Jan 15, 10:30"
      return (
        appointmentDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }) + `, ${time}`
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Find a Specialist Card - Primary Focus */}
      <div className="max-w-md mx-auto bg-emerald-600 text-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-2">Find a Counselor</h2>
        <p className="mb-6">
          Connect with Al Akhawayn University counseling services
        </p>
        <button
          onClick={handleBrowseSpecialists}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-medium py-3 rounded-md border border-emerald-400"
        >
          Browse Counselors
        </button>
      </div>

      {/* Recommended Specialists Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">University Counseling Team</h2>
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
            <button
              onClick={handleViewAppointments}
              className="text-indigo-600 text-sm"
            >
              View All &gt;
            </button>
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
                  className="border-b border-gray-100 pb-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  onClick={() => handleViewAppointment(appointment.id)}
                >
                  <div className="flex items-start">
                    <div className="text-indigo-600">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="font-medium">{appointment.title}</p>
                      <p className="text-xs text-gray-500">
                        {formatAppointmentDate(
                          appointment.date,
                          appointment.start_time
                        )}
                        {appointment.location && ` • ${appointment.location}`}
                      </p>
                      {appointment.specialist_name && (
                        <p className="text-sm text-gray-600 mt-1">
                          With: {appointment.specialist_name}
                        </p>
                      )}
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
              <p>No upcoming appointments.</p>
              <p className="text-sm mt-2">
                Book a consultation with one of our counselors.
              </p>
            </div>
          )}

          <div className="flex justify-center mt-4">
            <button
              onClick={handleBrowseSpecialists}
              className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Schedule Appointment
            </button>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Recent Conversations</h2>
            <button
              onClick={() => navigate('/chat')}
              className="text-indigo-600 text-sm"
            >
              View All &gt;
            </button>
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
                  className="border-b border-gray-100 pb-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
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
              <p>No conversations yet.</p>
              <p className="text-sm mt-2">
                Start a new conversation to get support.
              </p>
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
