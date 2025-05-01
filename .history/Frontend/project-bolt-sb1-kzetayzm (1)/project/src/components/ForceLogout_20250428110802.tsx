import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * This component is meant for development purposes only.
 * It forces a logout on initial app load to ensure authentication testing
 */
const ForceLogout: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const forceLogout = async () => {
      try {
        // Clear localStorage
        localStorage.clear();
        sessionStorage.clear();

        // Clear all cookies
        document.cookie.split(';').forEach((c) => {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });

        // Sign out of Supabase
        await supabase.auth.signOut({ scope: 'global' });

        // Verify that user is signed out
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.error('Failed to completely sign out user!');
          setError(
            'Failed to clear session. Please clear browser cache manually.'
          );
        } else {
          console.log('Successfully signed out user');
        }
      } catch (err) {
        console.error('Error during forced logout:', err);
        setError('Error during logout process');
      } finally {
        setLoading(false);
        // Auto-remove after 5 seconds
        setTimeout(() => {
          const element = document.getElementById('force-logout-container');
          if (element) {
            element.style.opacity = '0';
            setTimeout(() => {
              if (element.parentNode) {
                element.parentNode.removeChild(element);
              }
            }, 500);
          }
        }, 5000);
      }
    };

    forceLogout();
  }, []);

  if (!loading && !error) {
    return null;
  }

  return (
    <div
      id="force-logout-container"
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9999,
        padding: '0.75rem 1rem',
        backgroundColor: error ? '#FEE2E2' : '#EFF6FF',
        color: error ? '#B91C1C' : '#1E40AF',
        borderRadius: '0.375rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        fontSize: '0.875rem',
        transition: 'opacity 0.5s ease-in-out',
      }}
    >
      {loading ? (
        <div className="flex items-center">
          <div
            style={{
              width: '1rem',
              height: '1rem',
              borderRadius: '50%',
              borderTop: '2px solid currentColor',
              borderRight: '2px solid transparent',
              marginRight: '0.5rem',
              animation: 'spin 1s linear infinite',
            }}
          />
          <span>Clearing auth session...</span>
        </div>
      ) : error ? (
        <div>{error}</div>
      ) : (
        <div>Authentication cleared</div>
      )}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default ForceLogout;
