import React, { useState } from 'react';
import {
  Star,
  Calendar,
  Clock,
  ChevronLeft,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
} from 'lucide-react';

// Counselors data based on images provided
const counselors = [
  {
    id: '1',
    name: 'Aure Veyssière',
    title: 'Assistant Professor / Counselor',
    profession: 'Counselor',
    specialties: ['Anxiety', 'Academic Stress', 'Personal Development'],
    location: 'Building 6, room 108',
    availability: 'Available',
    rating: 4.8,
    description:
      'Specialized in helping students manage academic stress and anxiety with a focus on personal growth and development.',
    nextAvailable: 'Today, 2:00 PM',
    price: '400 MAD/hour',
    email: 'a.veyssiere@aui.ma',
    phone: '+212 535-862-000',
    imageUrl: '/api/placeholder/200/200',
  },
  {
    id: '2',
    name: 'Imane Boukhare',
    title: 'Full-time Counselor',
    profession: 'Counselor',
    specialties: ['Depression', 'Relationship Issues', 'Grief'],
    location: 'Building 8b, room 203',
    availability: 'Available',
    rating: 4.9,
    description:
      'Offers compassionate support for students dealing with depression, relationship challenges, and processing grief or loss.',
    nextAvailable: 'Today, 4:00 PM',
    price: '350 MAD/hour',
    email: 'i.boukhare@aui.ma',
    phone: '+212 535-862-001',
    imageUrl: '/api/placeholder/200/200',
  },
  {
    id: '3',
    name: 'Mohamed Ghali Guissi',
    title: 'Full-time Counselor',
    profession: 'Counselor',
    specialties: ['Stress Management', 'Cultural Adjustment', 'Anxiety'],
    location: 'Building 8b, room 309',
    availability: 'Busy',
    rating: 4.7,
    description:
      'Specializes in helping international students with cultural adjustment issues and managing stress in a multicultural environment.',
    nextAvailable: 'Tomorrow, 10:00 AM',
    price: '350 MAD/hour',
    email: 'm.guissi@aui.ma',
    phone: '+212 535-862-002',
    imageUrl: '/api/placeholder/200/200',
  },
  {
    id: '4',
    name: 'Prof. Jallal Toufiq',
    title: 'Part-time Psychiatrist',
    profession: 'Psychiatrist',
    specialties: [
      'Clinical Psychology',
      'Psychiatry',
      'Mental Health Disorders',
    ],
    location: 'Building 6, room 108',
    schedule: 'Thursday afternoon',
    availability: 'Away',
    rating: 4.9,
    description:
      'Clinical psychiatrist with expertise in diagnosing and treating a range of mental health conditions. Available for consultations on Thursdays.',
    nextAvailable: 'Thursday, 2:00 PM',
    price: '500 MAD/hour',
    email: 'j.toufiq@aui.ma',
    phone: '+212 535-862-003',
    imageUrl: '/api/placeholder/200/200',
  },
  {
    id: '5',
    name: 'Dr. El Jarrafi',
    title: 'Part-time Psychiatrist',
    profession: 'Psychiatrist',
    specialties: ['Psychiatric Evaluation', 'Medication Management', 'Therapy'],
    location: 'Building 26, Health center',
    schedule: 'Monday afternoon',
    availability: 'Away',
    rating: 4.8,
    description:
      'Experienced psychiatrist offering evaluations and medication management. Available for appointments at the Health Center on Mondays.',
    nextAvailable: 'Monday, 1:00 PM',
    price: '500 MAD/hour',
    email: 'el.jarrafi@aui.ma',
    phone: '+212 535-862-004',
    imageUrl: '/api/placeholder/200/200',
  },
];

// Dashboard component that has the "Find a Specialist" card
const Dashboard = ({ onSpecialistClick }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, elaraki48
        </h1>
        <p className="text-gray-600">Thursday, May 8, 2025</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Talk to eSaha Card */}
        <div className="bg-indigo-600 text-white rounded-xl shadow-md p-6 flex flex-col">
          <h3 className="text-xl font-medium mb-2">Talk to eSaha</h3>
          <p className="text-indigo-100 mb-6">
            Share your thoughts or get support anytime
          </p>
          <button className="mt-auto bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-300 border border-white/20 w-full">
            Start a Conversation
          </button>
        </div>

        {/* Find a Specialist Card */}
        <div className="bg-emerald-600 text-white rounded-xl shadow-md p-6 flex flex-col">
          <h3 className="text-xl font-medium mb-2">Find a Specialist</h3>
          <p className="text-emerald-100 mb-6">
            Connect with qualified mental health professionals
          </p>
          <button
            onClick={() => onSpecialistClick()}
            className="mt-auto bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-300 border border-white/20 w-full"
          >
            Browse Specialists
          </button>
        </div>

        {/* Schedule Session Card */}
        <div className="bg-amber-500 text-white rounded-xl shadow-md p-6 flex flex-col">
          <h3 className="text-xl font-medium mb-2">Schedule Session</h3>
          <p className="text-amber-100 mb-6">
            Book a therapy session or check-in
          </p>
          <button className="mt-auto bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-300 border border-white/20 w-full">
            Manage Appointments
          </button>
        </div>
      </div>

      {/* Request Immediate Help Button */}
      <div className="absolute top-6 right-6">
        <button className="flex items-center bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
          <svg
            className="w-5 h-5 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 9V14M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5 6.75329 17.2467 2.5 12 2.5C6.75329 2.5 2.5 6.75329 2.5 12C2.5 17.2467 6.75329 21.5 12 21.5ZM12 17.01L12.01 16.999L12 17.01Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Request Immediate Help
        </button>
      </div>
    </div>
  );
};

// SpecialistsList component that shows all specialists
const SpecialistsList = ({ onSpecialistSelect }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Mental Health Specialists
        </h1>
        <p className="text-gray-600">
          Find and connect with our team of professionals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {counselors.map((specialist) => (
          <div
            key={specialist.id}
            className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onSpecialistSelect(specialist.id)}
          >
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium text-gray-800">{specialist.name}</h3>
                <p className="text-sm text-gray-600">{specialist.title}</p>
              </div>
              <div className="flex items-center">
                <Star className="text-yellow-400 h-4 w-4" />
                <span className="text-sm font-medium ml-1">
                  {specialist.rating}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex flex-wrap gap-1 mb-2">
                {specialist.specialties.slice(0, 3).map((specialty, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                {specialist.description}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
              <div className="text-xs text-gray-500 flex items-center">
                <Clock size={12} className="mr-1" />
                {specialist.schedule || specialist.nextAvailable}
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
          </div>
        ))}
      </div>
    </div>
  );
};

// SpecialistDetail component that shows detailed view with calendar
const SpecialistDetail = ({ specialistId, onBack }) => {
  const specialist = counselors.find((s) => s.id === specialistId);
  const [selectedDate, setSelectedDate] = useState(8); // Default to 8th of the month (today)

  if (!specialist) return <div>Specialist not found</div>;

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    const today = 8; // May 8th
    for (let i = 1; i <= 17; i++) {
      days.push(i);
    }
    return days;
  };

  const days = generateCalendarDays();

  // Generate time slots for the selected day
  const timeSlots = [
    { time: '09:00', available: selectedDate !== 8 },
    { time: '10:00', available: selectedDate !== 8 },
    { time: '11:00', available: selectedDate !== 8 },
    { time: '12:00', available: false }, // Lunch break
    { time: '13:00', available: true },
    { time: '14:00', available: selectedDate === 8 },
    { time: '15:00', available: selectedDate === 8 },
    { time: '16:00', available: selectedDate === 8 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-gray-600 hover:text-gray-800"
      >
        <ChevronLeft size={20} />
        <span>Back to Specialists</span>
      </button>

      <div className="bg-white rounded-lg shadow-md">
        {/* Specialist header with status badge */}
        <div className="relative p-6">
          <span
            className={`absolute top-6 right-6 text-sm px-3 py-1 rounded-full ${
              specialist.availability === 'Available'
                ? 'bg-green-100 text-green-800'
                : specialist.availability === 'Busy'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {specialist.availability}
          </span>

          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 mb-6 md:mb-0">
              <img
                src={specialist.imageUrl}
                alt={specialist.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>

            <div className="md:w-2/3 md:pl-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {specialist.name}
                  </h1>
                  <p className="text-lg text-gray-600">
                    {specialist.profession}
                  </p>
                </div>
                <div className="flex items-center">
                  <Star className="text-yellow-400" />
                  <span className="ml-1 text-lg font-medium">
                    {specialist.rating}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {specialist.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-gray-700">{specialist.description}</p>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-700">
                  <MapPin size={16} className="mr-2 text-gray-500" />
                  <span>{specialist.location}</span>
                </div>
                {specialist.schedule && (
                  <div className="flex items-center text-gray-700">
                    <Clock size={16} className="mr-2 text-gray-500" />
                    <span>Available: {specialist.schedule}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-700">
                  <Phone size={16} className="mr-2 text-gray-500" />
                  <span>{specialist.phone}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Mail size={16} className="mr-2 text-gray-500" />
                  <span>{specialist.email}</span>
                </div>
              </div>

              <div className="mt-6 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center justify-center">
                  <Calendar size={16} className="mr-2" />
                  Book Consultation
                </button>
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium flex items-center justify-center">
                  <MessageSquare size={16} className="mr-2" />
                  Message
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar section */}
        <div className="border-t border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">
            Availability
          </h2>

          {/* Month header */}
          <div className="flex justify-between items-center mb-4">
            <button className="text-gray-500 hover:text-gray-700">
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-lg font-medium">May 2025</h3>
            <button className="text-gray-500 hover:text-gray-700">
              <ChevronLeft size={20} className="transform rotate-180" />
            </button>
          </div>

          {/* Week days */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            <div className="text-sm text-gray-600">Sun</div>
            <div className="text-sm text-gray-600">Mon</div>
            <div className="text-sm text-gray-600">Tue</div>
            <div className="text-sm text-gray-600">Wed</div>
            <div className="text-sm text-gray-600">Thu</div>
            <div className="text-sm text-gray-600">Fri</div>
            <div className="text-sm text-gray-600">Sat</div>
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1 mb-6">
            {/* Blank spaces for days before May 1st */}
            <div></div>
            <div></div>
            <div></div>

            {/* Calendar days */}
            {days.map((day) => (
              <div
                key={day}
                onClick={() => setSelectedDate(day)}
                className={`
                  h-10 flex items-center justify-center rounded-full cursor-pointer
                  ${
                    selectedDate === day
                      ? 'bg-blue-600 text-white'
                      : day === 8
                      ? 'border border-blue-600 text-blue-600'
                      : 'hover:bg-gray-100'
                  }
                `}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Time slots */}
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Available Times on May {selectedDate}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {timeSlots.map((slot, index) => (
              <button
                key={index}
                disabled={!slot.available}
                className={`
                  py-2 px-4 rounded-lg text-center
                  ${
                    slot.available
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {slot.time}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component that manages navigation between views
const SpecialistBrowser = () => {
  const [view, setView] = useState('dashboard'); // dashboard, list, detail
  const [selectedSpecialistId, setSelectedSpecialistId] = useState(null);

  const navigateToDashboard = () => {
    setView('dashboard');
    setSelectedSpecialistId(null);
  };

  const navigateToList = () => {
    setView('list');
  };

  const navigateToDetail = (specialistId) => {
    setSelectedSpecialistId(specialistId);
    setView('detail');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {view === 'dashboard' && <Dashboard onSpecialistClick={navigateToList} />}

      {view === 'list' && (
        <SpecialistsList onSpecialistSelect={navigateToDetail} />
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

export default SpecialistBrowser;
