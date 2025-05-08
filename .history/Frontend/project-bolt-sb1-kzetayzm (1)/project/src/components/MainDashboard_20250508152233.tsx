import React, { useState } from 'react';
import {
  ChevronLeft,
  Star,
  Clock,
  Calendar,
  MapPin,
  Phone,
  MessageSquare,
  Globe,
  Mail,
  User,
  FileText,
  Award,
  ThumbsUp,
  MessageCircle,
} from 'lucide-react';

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

// Main Dashboard Component
const Dashboard = ({ onBrowseSpecialists }) => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Only the Find a Specialist card as requested */}
      <div className="max-w-md mx-auto bg-emerald-600 text-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-2">Find a Specialist</h2>
        <p className="mb-6">
          Connect with qualified mental health professionals
        </p>
        <button
          onClick={onBrowseSpecialists}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-medium py-3 rounded-md border border-emerald-400"
        >
          Browse Specialists
        </button>
      </div>
    </div>
  );
};

// Specialists List Component
const SpecialistsList = ({ onSelectSpecialist }) => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Specialists cards row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {specialists.map((specialist) => (
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
                {specialist.specialties.map((specialty, index) => (
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
                onClick={() => onSelectSpecialist(specialist.id)}
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
            <a href="#" className="text-indigo-600 text-sm">
              View All &gt;
            </a>
          </div>

          <div className="text-gray-600 text-center py-6">
            No upcoming appointments.
          </div>

          <div className="flex justify-center">
            <button className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded">
              <Calendar className="mr-2 h-5 w-5" />
              Schedule Appointment
            </button>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Recent Conversations</h2>
            <a href="#" className="text-indigo-600 text-sm">
              View All &gt;
            </a>
          </div>

          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-gray-100 pb-3">
                <div className="flex items-start">
                  <div className="text-indigo-600">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">New Chat</p>
                    <p className="text-xs text-gray-500">
                      5/8/2025 • 0 messages
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-4">
            <button className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded">
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
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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

// Specialist Detail Component
const SpecialistDetail = ({ specialistId, onBack }) => {
  const specialist =
    specialists.find((s) => s.id === specialistId) || specialists[2]; // Default to Michael Williams if not found
  const [activeTab, setActiveTab] = useState('availability');

  // Calendar rendering
  const renderCalendar = () => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push(i);
    }

    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-4">
          <button className="text-gray-400">
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-medium">May 2025</h3>
          <button className="text-gray-400 transform rotate-180">
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center mb-2">
          <div className="text-sm text-gray-500">Sun</div>
          <div className="text-sm text-gray-500">Mon</div>
          <div className="text-sm text-gray-500">Tue</div>
          <div className="text-sm text-gray-500">Wed</div>
          <div className="text-sm text-gray-500">Thu</div>
          <div className="text-sm text-gray-500">Fri</div>
          <div className="text-sm text-gray-500">Sat</div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Empty cells for days before month start */}
          <div></div>
          <div></div>
          <div></div>

          {days.map((day) => (
            <div
              key={day}
              className={`h-10 flex items-center justify-center rounded-full cursor-pointer
                ${day === 8 ? 'border-2 border-blue-500 text-blue-500' : ''}
                ${
                  day >= 1 && day <= 17
                    ? 'hover:bg-gray-100'
                    : 'text-gray-300 cursor-not-allowed'
                }
              `}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="mt-4 text-center text-gray-600">
          Select a date to view available time slots.
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-4">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ChevronLeft size={16} className="mr-1" />
          Back to Specialists
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="relative">
          {/* Busy badge */}
          <div className="absolute top-4 right-4">
            <span className="bg-amber-400 text-white px-3 py-1 rounded-full text-sm font-medium">
              Busy
            </span>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row">
              {/* Specialist image */}
              <div className="md:w-1/4 mb-6 md:mb-0">
                <img
                  src={specialist.imageUrl}
                  alt={specialist.name}
                  className="rounded-lg w-full h-auto"
                />
              </div>

              {/* Specialist details */}
              <div className="md:w-3/4 md:pl-8">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h1 className="text-2xl font-bold">{specialist.name}</h1>
                    <p className="text-gray-600 text-lg">{specialist.title}</p>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400" />
                    <span className="ml-1 font-medium">
                      {specialist.rating}
                    </span>
                    <span className="ml-1 text-gray-500 text-sm">
                      ({specialist.reviews} reviews)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {specialist.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>Chicago, IL</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{specialist.phone}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{specialist.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Globe className="h-4 w-4 mr-2" />
                    <a href="#" className="text-blue-600 hover:underline">
                      {specialist.website}
                    </a>
                  </div>
                </div>

                <div className="flex items-center mb-4">
                  <span className="text-xl font-bold">{specialist.price}</span>
                  <span className="text-gray-500 ml-1">/ hour</span>
                </div>

                <div className="flex space-x-3">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded flex items-center justify-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Book
                  </button>
                  <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-6 rounded flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Message
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-200">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('about')}
                className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'about'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <User className="h-4 w-4 mr-2" />
                About
              </button>
              <button
                onClick={() => setActiveTab('experience')}
                className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'experience'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Experience
              </button>
              <button
                onClick={() => setActiveTab('credentials')}
                className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'credentials'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Award className="h-4 w-4 mr-2" />
                Credentials
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'reviews'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Reviews
              </button>
              <button
                onClick={() => setActiveTab('availability')}
                className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'availability'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Availability
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'messages'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Messages
              </button>
            </div>

            {/* Tab content */}
            <div className="p-6">
              {activeTab === 'about' && (
                <p className="text-gray-700">{specialist.description}</p>
              )}

              {activeTab === 'availability' && renderCalendar()}

              {activeTab !== 'about' && activeTab !== 'availability' && (
                <div className="text-center text-gray-500 py-8">
                  No {activeTab} information available.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component to manage navigation between views
const SpecialistFinder = () => {
  const [view, setView] = useState('dashboard');
  const [selectedSpecialistId, setSelectedSpecialistId] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {view === 'dashboard' && (
        <Dashboard onBrowseSpecialists={() => setView('list')} />
      )}

      {view === 'list' && (
        <SpecialistsList
          onSelectSpecialist={(id) => {
            setSelectedSpecialistId(id);
            setView('detail');
          }}
        />
      )}

      {view === 'detail' && (
        <SpecialistDetail
          specialistId={selectedSpecialistId}
          onBack={() => setView('list')}
        />
      )}
    </div>
  );
};

export default SpecialistFinder;
