// LocationSettings.tsx
import React, { useState, useEffect } from 'react';
import { MapPin, Compass, Save } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import useAuth from '../contexts/useAuth';
import API from '../services/api';

interface LocationSettingsProps {
  onClose?: () => void;
}

const LocationSettings: React.FC<LocationSettingsProps> = ({ onClose }) => {
  const [location, setLocation] = useState('');
  const [savedLocation, setSavedLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    // Fetch the user's saved location when component mounts
    const fetchUserLocation = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const profile = await API.profile.getProfile(token);
        if (profile && profile.location) {
          setLocation(profile.location);
          setSavedLocation(profile.location);
        }
      } catch (error) {
        console.error('Error fetching user location:', error);
      }
    };

    fetchUserLocation();
  }, [getToken]);

  const handleAutoDetect = () => {
    setIsLocating(true);
    setError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Use reverse geocoding to get city/region from coordinates
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10`
            );

            const data = await response.json();

            if (data && data.address) {
              // Try to get city, town, or village name
              const locationName =
                data.address.city ||
                data.address.town ||
                data.address.village ||
                data.address.county ||
                data.address.state;

              if (locationName) {
                setLocation(locationName);
              } else {
                setError('Could not determine your location name');
              }
            } else {
              setError('Could not retrieve location information');
            }
          } catch (err) {
            console.error('Error getting location name:', err);
            setError('Failed to get location name');
          } finally {
            setIsLocating(false);
          }
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError(`Error getting location: ${err.message}`);
          setIsLocating(false);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      setIsLocating(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!location.trim()) {
      setError('Please enter a location');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      // Update user profile with location
      await API.profile.updateProfile(token, { location });
      setSavedLocation(location);

      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Error saving location:', err);
      setError('Failed to save location');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-medium text-gray-800 mb-4">
        Your Location Settings
      </h3>

      <p className="text-gray-600 mb-4">
        Sharing your location helps us recommend local mental health resources
        and support groups in your area.
      </p>

      <div className="mb-4">
        <Input
          label="Your City/Region"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter your city or region"
          error={error || undefined}
        />
      </div>

      <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
        <Button
          variant="secondary"
          className="flex items-center justify-center gap-2"
          onClick={handleAutoDetect}
          isLoading={isLocating}
        >
          <Compass size={16} />
          <span>Auto-Detect Location</span>
        </Button>

        <Button
          className="flex items-center justify-center gap-2"
          onClick={handleSaveLocation}
          isLoading={isLoading}
          disabled={!location || location === savedLocation}
        >
          <Save size={16} />
          <span>Save Location</span>
        </Button>
      </div>

      {savedLocation && (
        <div className="mt-4 flex items-center text-sm text-green-600">
          <MapPin size={16} className="mr-1" />
          <span>Currently using: {savedLocation}</span>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>
          Your location is only used to provide relevant local resources. You
          can change or remove it at any time.
        </p>
      </div>
    </div>
  );
};

export default LocationSettings;
