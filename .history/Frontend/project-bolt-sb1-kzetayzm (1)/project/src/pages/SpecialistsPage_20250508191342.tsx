import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  // Only import what we're using
  Star,
  MapPin,
  Search,
  Filter,
} from 'lucide-react';
import API, { Specialist } from '../services/api';
import useAuth from '../contexts/useAuth';
import SpecialistDetail from '../components/SpecialistDetail';

// Define interfaces for type safety
interface SpecialistsListProps {
  specialists: Specialist[];
  onSelectSpecialist: (id: string) => void;
}

// Specialists List Component
const SpecialistsList: React.FC<SpecialistsListProps> = ({
  specialists,
  onSelectSpecialist,
}) => {
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
                placeholder="Search counselors by name, title, or keyword"
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
          {filteredSpecialists.length} Counselors Available
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

              {specialist.location && (
                <div className="text-sm text-gray-600 mb-3 flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                  {specialist.location}
                </div>
              )}

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

// Main component to manage navigation between views
const SpecialistsPage: React.FC = () => {
  const { accessToken } = useAuth();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<
    string | null
  >(null);

  // Fetch specialists data
  useEffect(() => {
    const fetchSpecialists = async () => {
      if (!accessToken) return;

      try {
        setLoading(true);

        // Use the API service to get specialists, but with a fallback to hardcoded data
        let specialistsData: Specialist[] = [];

        try {
          // Try to get from API, but catch and fallback if it fails
          specialistsData = await API.specialists.getAllSpecialists(
            accessToken
          );
        } catch (error) {
          console.log('Using fallback specialist data');

          // Fallback to hardcoded data
          specialistsData = [
            {
              id: '1',
              name: 'Aure Veyssière',
              title: 'Assistant Professor / Counselor',
              specialties: [
                'Counseling',
                'Academic Support',
                'Stress Management',
              ],
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
                'Experienced psychiatrist providing specialized mental health support for students with complex needs. Available on campus Thursday afternoons.',
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
                'Licensed psychiatrist offering expert mental health care and support for students facing psychological challenges. Available on campus Monday afternoons.',
              availability: 'Limited',
              nextAvailable: 'Monday afternoon',
              location: 'Building 26, Health center',
              rating: 4.8,
              reviews: 46,
              price: 'Free for students',
              imageUrl: '/api/placeholder/300/300',
            },
          ];
        }

        setSpecialists(specialistsData);
      } catch (err) {
        console.error('Failed to fetch specialists:', err);
        setError('Failed to load specialists. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialists();
  }, [accessToken]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            <p className="font-medium">{error}</p>
            <button
              className="mt-2 text-blue-600 hover:text-blue-800"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {view === 'list' && (
        <SpecialistsList
          specialists={specialists}
          onSelectSpecialist={(id: string) => {
            setSelectedSpecialistId(id);
            setView('detail');
          }}
        />
      )}

      {view === 'detail' && selectedSpecialistId && (
        <SpecialistDetail
          specialistId={selectedSpecialistId}
          onBack={() => setView('list')}
        />
      )}
    </DashboardLayout>
  );
};

export default SpecialistsPage;
