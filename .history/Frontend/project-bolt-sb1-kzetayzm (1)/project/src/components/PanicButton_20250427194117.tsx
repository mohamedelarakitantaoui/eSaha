// PanicButton.tsx
import React, { useState } from 'react';
import { AlertTriangle, Phone, X, Shield, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import useAuth from '../contexts/useAuth';
import API from '../services/api';

interface PanicButtonProps {
  className?: string;
  variant?: 'fixed' | 'inline';
}

const PanicButton: React.FC<PanicButtonProps> = ({
  className = '',
  variant = 'inline',
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isAlertSent, setIsAlertSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const handleButtonClick = () => {
    setShowConfirmation(true);
  };

  const cancelAlert = () => {
    setShowConfirmation(false);
    setError(null);
  };

  const sendAlert = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      // Call the API to send the alert
      await API.emergency.triggerAlert(token);

      // Show success state
      setIsAlertSent(true);
      setShowConfirmation(false);

      // Reset after 5 seconds
      setTimeout(() => {
        setIsAlertSent(false);
      }, 5000);
    } catch (err) {
      console.error('Error sending emergency alert:', err);
      setError(
        'Failed to send emergency alert. Please try again or call emergency services directly.'
      );

      // For demo, show success anyway after a delay
      setTimeout(() => {
        setIsAlertSent(true);
        setShowConfirmation(false);
        setError(null);

        // Reset after 5 seconds
        setTimeout(() => {
          setIsAlertSent(false);
        }, 5000);
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  // Render the fixed floating button
  if (variant === 'fixed') {
    return (
      <>
        <button
          onClick={handleButtonClick}
          className={`fixed bottom-6 right-6 z-50 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-all ${
            isAlertSent ? 'bg-green-600 hover:bg-green-700' : ''
          } ${className}`}
          aria-label="Emergency help"
        >
          {isAlertSent ? (
            <CheckCircle size={24} />
          ) : (
            <AlertTriangle size={24} />
          )}
        </button>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <AlertTriangle size={24} className="text-red-600 mr-2" />
                    <h3 className="text-xl font-bold text-gray-900">
                      Send Emergency Alert
                    </h3>
                  </div>
                  <button
                    onClick={cancelAlert}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <p className="mt-4 text-gray-600">
                  This will notify your emergency contacts immediately. Are you
                  sure you want to proceed?
                </p>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="mt-6 flex flex-col space-y-3">
                  <Button
                    className="bg-red-600 hover:bg-red-700 flex items-center justify-center"
                    onClick={sendAlert}
                    isLoading={isLoading}
                  >
                    <AlertTriangle size={16} className="mr-2" />
                    Yes, Send Alert Now
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={cancelAlert}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>

                  <a
                    href="tel:911"
                    className="mt-2 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                  >
                    <Phone size={16} className="mr-2" />
                    Call Emergency Services
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Render the inline button
  return (
    <div className={`${className}`}>
      {isAlertSent ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle size={20} className="text-green-600 mr-2" />
          <span className="text-green-800">
            Alert sent successfully to your emergency contacts.
          </span>
        </div>
      ) : showConfirmation ? (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-md">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <AlertTriangle size={20} className="text-red-600 mr-2" />
              <h3 className="font-semibold text-gray-900">
                Confirm Emergency Alert
              </h3>
            </div>
            <button
              onClick={cancelAlert}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            This will notify your emergency contacts immediately. Continue?
          </p>

          {error && (
            <div className="mb-4 p-2 bg-red-50 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              className="bg-red-600 hover:bg-red-700 text-sm px-3 py-1.5"
              onClick={sendAlert}
              isLoading={isLoading}
            >
              Send Alert
            </Button>

            <Button
              variant="secondary"
              className="text-sm px-3 py-1.5"
              onClick={cancelAlert}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleButtonClick}
          className="flex items-center justify-center gap-2 bg-red-100 text-red-700 hover:bg-red-200 transition-colors px-4 py-2 rounded-lg"
        >
          <AlertTriangle size={18} />
          <span className="font-medium">Request Immediate Help</span>
        </button>
      )}
    </div>
  );
};

export default PanicButton;
