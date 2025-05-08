import { useContext } from 'react';
import { AuthContext, AuthContextType } from './AuthContext';

// Enhanced custom hook to use auth context with more robust token handling
const useAuth = (): AuthContextType & {
  getToken: () => Promise<string | null>;
} => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Add a reliable getToken function if it doesn't exist or enhance the existing one
  const getToken = async (): Promise<string | null> => {
    try {
      // First check if the context already has an accessToken
      if (context.accessToken) {
        return context.accessToken;
      }

      // If not in context, check localStorage as fallback
      const localToken = localStorage.getItem('access_token');
      if (localToken) {
        console.log('Retrieved token from localStorage');
        return localToken;
      }

      // If we still don't have a token, check sessionStorage as another fallback
      const sessionToken = sessionStorage.getItem('access_token');
      if (sessionToken) {
        console.log('Retrieved token from sessionStorage');
        return sessionToken;
      }

      // Last resort: try to get from Supabase directly
      if (typeof context.getSession === 'function') {
        const session = await context.getSession();
        return session?.access_token || null;
      }

      console.warn('No authentication token available');
      return null;
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  };

  // Return the enhanced context with our robust getToken function
  return {
    ...context,
    getToken,
  };
};

export default useAuth;
