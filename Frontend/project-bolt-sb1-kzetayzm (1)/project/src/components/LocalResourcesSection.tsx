// LocalResourcesSection.tsx
import React, { useState, useEffect } from 'react';
import {
  MapPin,
  ExternalLink,
  MoreHorizontal,
  Phone,
  Calendar,
  Users,
} from 'lucide-react';
import { Button } from './Button';
import useAuth from '../contexts/useAuth';
import API from '../services/api';

interface LocalResource {
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

const ResourceCard: React.FC<{ resource: LocalResource }> = ({ resource }) => {
  const getIconForResourceType = (type: string) => {
    switch (type) {
      case 'crisis':
        return <Phone className="text-red-500" size={20} />;
      case 'support_group':
        return <Users className="text-green-500" size={20} />;
      case 'counseling':
        return <Calendar className="text-blue-500" size={20} />;
      case 'wellness':
        return <MapPin className="text-purple-500" size={20} />;
      default:
        return <MapPin className="text-gray-500" size={20} />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          {getIconForResourceType(resource.type)}
          <h3 className="text-lg font-medium text-gray-800 ml-2">
            {resource.name}
          </h3>
        </div>
        {resource.distance && (
          <span className="text-sm text-gray-500">{resource.distance} mi</span>
        )}
      </div>

      <p className="text-gray-600 text-sm mb-3">{resource.description}</p>

      {resource.address && (
        <div className="flex items-start mb-2">
          <MapPin size={16} className="text-gray-400 mr-2 mt-1" />
          <span className="text-sm text-gray-600">{resource.address}</span>
        </div>
      )}

      {resource.phone && (
        <div className="flex items-center mb-2">
          <Phone size={16} className="text-gray-400 mr-2" />
          <a
            href={`tel:${resource.phone}`}
            className="text-sm text-indigo-600 hover:underline"
          >
            {resource.phone}
          </a>
        </div>
      )}

      <div className="flex justify-between items-center mt-3">
        {resource.website ? (
          <a
            href={resource.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:underline flex items-center"
          >
            Visit Website <ExternalLink size={14} className="ml-1" />
          </a>
        ) : (
          <span></span>
        )}

        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal size={18} />
        </button>
      </div>
    </div>
  );
};

const LocalResourcesSection: React.FC = () => {
  const [resources, setResources] = useState<LocalResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const profile = await API.profile.getProfile(token);
        if (profile && profile.location) {
          setUserLocation(profile.location);
          fetchLocalResources(profile.location);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [getToken]);

  const fetchLocalResources = async (location: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      // Call API to get resources based on location
      const response = await API.resources.getLocalResources(token, location);
      setResources(response);
    } catch (err) {
      console.error('Error fetching local resources:', err);
      setError('Failed to load local resources');

      // Fallback to mock data for demo purposes
      setResources([
        {
          id: '1',
          name: 'Community Mental Health Center',
          description:
            'Offers counseling, therapy, and support services for various mental health concerns.',
          type: 'counseling',
          address: `123 Main St, ${location || 'Your City'}`,
          phone: '555-123-4567',
          website: 'https://example.com/cmhc',
          distance: 2.3,
        },
        {
          id: '2',
          name: 'Anxiety & Depression Support Group',
          description:
            'Weekly peer support meetings for individuals experiencing anxiety and depression.',
          type: 'support_group',
          address: `456 Oak Ave, ${location || 'Your City'}`,
          website: 'https://example.com/support',
          hours: 'Tuesdays 7-9PM',
          distance: 3.1,
        },
        {
          id: '3',
          name: 'Crisis Response Center',
          description:
            '24/7 emergency mental health services and crisis intervention.',
          type: 'crisis',
          phone: '555-911-HELP',
          website: 'https://example.com/crisis',
          address: `789 Emergency Blvd, ${location || 'Your City'}`,
          distance: 5.8,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!userLocation) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          Local Resources
        </h3>
        <p className="text-gray-600 mb-4">
          Add your location to see mental health resources in your area.
        </p>
        <Button
          onClick={() => {
            /* Open location settings */
          }}
          className="flex items-center gap-2"
        >
          <MapPin size={16} />
          <span>Set Your Location</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800">
          Mental Health Resources Near You
        </h3>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin size={14} className="mr-1" />
          <span>{userLocation}</span>
        </div>
      </div>

      {error ? (
        <div className="text-red-500 mb-4">{error}</div>
      ) : (
        <div className="space-y-4">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}

      <div className="mt-4 text-center">
        <a
          href="#"
          className="text-indigo-600 text-sm hover:underline"
          onClick={(e) => {
            e.preventDefault();
            // Open full resources directory
          }}
        >
          View all resources in your area
        </a>
      </div>
    </div>
  );
};

export default LocalResourcesSection;
