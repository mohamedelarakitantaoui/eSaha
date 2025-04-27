import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  PhoneCall,
  ExternalLink,
  Filter,
  Users,
  Calendar,
  Heart,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';
import useAuth from '../contexts/useAuth';
import API from '../services/api';

interface Resource {
  id: string;
  name: string;
  description: string;
  type: 'crisis' | 'support_group' | 'counseling' | 'wellness';
  address?: string;
  phone?: string;
  website?: string;
  hours?: string;
  distance?: number;
}

const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(25);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const profile = await API.profile.getProfile(token);
        if (profile && profile.location) {
          setUserLocation(profile.location);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [getToken]);

  useEffect(() => {
    if (userLocation) {
      fetchResources();
    }
  }, [userLocation]);

  useEffect(() => {
    filterResources();
  }, [resources, searchQuery, selectedType, maxDistance]);

  const fetchResources = async () => {
    if (!userLocation) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const response = await API.resources.getLocalResources(
        token,
        userLocation
      );
      setResources(response);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Failed to load resources. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterResources = () => {
    if (!resources.length) {
      setFilteredResources([]);
      return;
    }

    let filtered = [...resources];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (resource) =>
          resource.name.toLowerCase().includes(query) ||
          (resource.description &&
            resource.description.toLowerCase().includes(query))
      );
    }

    // Filter by type
    if (selectedType) {
      filtered = filtered.filter((resource) => resource.type === selectedType);
    }

    // Filter by distance
    if (maxDistance < 25) {
      filtered = filtered.filter(
        (resource) => !resource.distance || resource.distance <= maxDistance
      );
    }

    setFilteredResources(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleTypeFilter = (type: string | null) => {
    setSelectedType(type === selectedType ? null : type);
  };

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxDistance(parseInt(e.target.value));
  };

  const renderResourceCard = (resource: Resource) => {
    const getIconForResourceType = (type: string) => {
      switch (type) {
        case 'crisis':
          return <PhoneCall className="text-red-500" size={20} />;
        case 'support_group':
          return <Users className="text-green-500" size={20} />;
        case 'counseling':
          return <Calendar className="text-blue-500" size={20} />;
        case 'wellness':
          return <Heart className="text-purple-500" size={20} />;
        default:
          return <MapPin className="text-gray-500" size={20} />;
      }
    };

    return (
      <div
        key={resource.id}
        className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            {getIconForResourceType(resource.type)}
            <h3 className="text-lg font-medium text-gray-800 ml-2">
              {resource.name}
            </h3>
          </div>
          {resource.distance && (
            <span className="text-sm text-gray-500">
              {resource.distance} mi
            </span>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-4">{resource.description}</p>

        <div className="space-y-2 mb-4">
          {resource.address && (
            <div className="flex items-start">
              <MapPin size={16} className="text-gray-400 mr-2 mt-1" />
              <span className="text-sm text-gray-600">{resource.address}</span>
            </div>
          )}

          {resource.phone && (
            <div className="flex items-center">
              <PhoneCall size={16} className="text-gray-400 mr-2" />
              <a
                href={`tel:${resource.phone}`}
                className="text-sm text-indigo-600 hover:underline"
              >
                {resource.phone}
              </a>
            </div>
          )}

          {resource.hours && (
            <div className="flex items-center">
              <Calendar size={16} className="text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">{resource.hours}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
          <div>
            <span className="px-2 py-1 bg-gray-100 text-xs font-medium rounded-full capitalize">
              {resource.type.replace('_', ' ')}
            </span>
          </div>

          {resource.website && (
            <a
              href={resource.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:underline flex items-center"
            >
              Visit Website <ExternalLink size={14} className="ml-1" />
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Mental Health Resources
          </h1>
          <p className="text-gray-600">
            Find mental health resources and support in your area
          </p>
        </div>

        {/* Location and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="md:flex-1">
              <div className="flex items-center text-gray-700 mb-3">
                <MapPin size={18} className="text-indigo-600 mr-2" />
                <span className="font-medium">Your Location:</span>
                <span className="ml-2">{userLocation || 'Not set'}</span>
              </div>

              {!userLocation && (
                <Button
                  onClick={() => {
                    /* Navigate to settings */
                  }}
                >
                  Set Location
                </Button>
              )}
            </div>

            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <Filter size={18} className="text-indigo-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-800">
              Filter Resources
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resource Type
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleTypeFilter('crisis')}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    selectedType === 'crisis'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Crisis
                </button>
                <button
                  onClick={() => handleTypeFilter('support_group')}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    selectedType === 'support_group'
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Support Groups
                </button>
                <button
                  onClick={() => handleTypeFilter('counseling')}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    selectedType === 'counseling'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Counseling
                </button>
                <button
                  onClick={() => handleTypeFilter('wellness')}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    selectedType === 'wellness'
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Wellness
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Distance: {maxDistance} miles
              </label>
              <input
                type="range"
                min="1"
                max="25"
                value={maxDistance}
                onChange={handleDistanceChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType(null);
                  setMaxDistance(25);
                }}
                variant="secondary"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
          ) : !userLocation ? (
            <div className="bg-yellow-50 text-yellow-700 p-6 rounded-lg text-center">
              <p className="mb-4">
                Please set your location to find resources near you.
              </p>
              <Button className="inline-flex items-center">
                <MapPin size={16} className="mr-2" />
                Set Your Location
              </Button>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-gray-600">
                No resources found matching your criteria. Try adjusting your
                filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map(renderResourceCard)}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResourcesPage;
