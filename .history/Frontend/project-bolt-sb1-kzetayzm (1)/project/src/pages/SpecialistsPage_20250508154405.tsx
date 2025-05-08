import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
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
  Search,
  Filter,
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
  {
    id: '4',
    name: 'Dr. Emily Chen',
    title: 'Psychiatrist',
    specialties: ['Bipolar Disorder', 'ADHD', 'Medication Management'],
    description:
      'Board-certified psychiatrist specializing in medication management for various mental health conditions.',
    availability: 'Available',
    nextAvailable: 'Tomorrow, 1:00 PM',
    rating: 4.9,
    reviews: 112,
    price: '$300/hour',
    imageUrl: '/api/placeholder/300/300',
  },
  {
    id: '5',
    name: 'Lisa Rodriguez, LCSW',
    title: 'Licensed Clinical Social Worker',
    specialties: ['Family Therapy', 'Grief Counseling', 'Stress Management'],
    description:
      'Compassionate social worker with expertise in helping families navigate difficult transitions and loss.',
    availability: 'Available',
    nextAvailable: 'Friday, 10:00 AM',
    rating: 4.8,
    reviews: 74,
    price: '$150/hour',
    imageUrl: '/api/placeholder/300/300',
  },
  {
    id: '6',
    name: 'Dr. Robert Taylor',
    title: 'Neuropsychologist',
    specialties: ['Cognitive Assessment', 'Brain Injury', 'Memory Disorders'],
    description:
      'Specialized in neuropsychological assessment and cognitive rehabilitation for individuals with brain-based disorders.',
    availability: 'Busy',
    nextAvailable: 'Next Monday, 9:00 AM',
    rating: 4.6,
    reviews: 65,
    price: '$275/hour',
    imageUrl: '/api/placeholder/300/300',
  },
];

// Specialists List Component
const SpecialistsList = ({ onSelectSpecialist }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  // Get all unique specialties
  const allSpecialties = Array.from(
    new Set(specialists.flatMap((s) => s.specialties))
  );

  // Filter specialists based on search and specialty
  const filteredSpecialists = specialists.filter((specialist) => {
    const matchesSearch =
      searchTerm === '' ||
      specialist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialist.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecialty =
      selectedSpecialty === '' ||
      specialist.specialties.includes(selectedSpecialty);

    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Search and filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search specialists by name, title, or keyword"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="w-full md:w-64">
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
              >
                <option value="">All Specialties</option>
                {allSpecialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Specialists cards */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6">
          {filteredSpecialists.length} Specialists Available
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredSpecialists.map((specialist) => (
            <div
              key={specialist.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="mb-2">
                <h3 className="text-lg font-medium">{specialist.name}</h3>
                <p className="text-gray-600">{specialist.title}</p>
              </div>

              <div className="mb-2 flex justify-end">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <span className="ml-1 font-medium">{specialist.rating}</span>
                  <span className="ml-1 text-gray-500 text-sm">
                    ({specialist.reviews})
                  </span>
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

              <div className="text-lg font-semibold mb-3">
                {specialist.price}
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
    </div>
  );
};

// Specialist Detail Component
const SpecialistDetail = ({ specialistId, onBack }) => {
  const specialist =
    specialists.find((s) => s.id === specialistId) || specialists[0];
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
          {/* Availability badge */}
          <div className="absolute top-4 right-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                specialist.availability === 'Available'
                  ? 'bg-green-400 text-white'
                  : 'bg-amber-400 text-white'
              }`}
            >
              {specialist.availability}
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
                  {specialist.location && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{specialist.location}</span>
                    </div>
                  )}
                  {specialist.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{specialist.phone}</span>
                    </div>
                  )}
                  {specialist.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>{specialist.email}</span>
                    </div>
                  )}
                  {specialist.website && (
                    <div className="flex items-center text-gray-600">
                      <Globe className="h-4 w-4 mr-2" />
                      <a href="#" className="text-blue-600 hover:underline">
                        {specialist.website}
                      </a>
                    </div>
                  )}
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
const SpecialistsPage = () => {
  const [view, setView] = useState('list');
  const [selectedSpecialistId, setSelectedSpecialistId] = useState(null);

  return (
    <DashboardLayout>
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
    </DashboardLayout>
  );
};

export default SpecialistsPage;
