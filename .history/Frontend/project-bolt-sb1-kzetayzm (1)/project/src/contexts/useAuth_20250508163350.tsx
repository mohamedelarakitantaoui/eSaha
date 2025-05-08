import { useContext } from 'react';
import { AuthContext, AuthContextType } from './AuthContext';

// Custom hook to use auth context
const useAuth = (): AuthContextType & {
  getToken: () => Promise<string | null>;
} => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Simple getToken function that avoids complex fallback logic
  const getToken = async (): Promise<string | null> => {
    try {
      // Return the token from context if available
      if (context.accessToken) {
        console.log('Using token from context');
        return context.accessToken;
      }

      // Simple fallback to localStorage
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        console.log('Using token from localStorage');
        return storedToken;
      }

      console.log('No token available');
      return null;
    } catch (error) {
      console.error('Error in getToken:', error);
      return null;
    }
  };

  return {
    ...context,
    getToken,
  };
};

export default useAuth;
