import { supabase } from '../lib/supabase';

/**
 * Completely clears all authentication state
 * This is more thorough than a regular sign out
 */
export const clearAuthState = async (): Promise<void> => {
  try {
    console.log('Clearing all authentication state...');

    // Remove any locally stored tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('supabase.auth.token');

    // Clear any items with auth or token in the name
    Object.keys(localStorage).forEach((key) => {
      if (
        key.toLowerCase().includes('auth') ||
        key.toLowerCase().includes('token')
      ) {
        localStorage.removeItem(key);
      }
    });

    // Clear session storage too
    sessionStorage.clear();

    // Force Supabase to sign out
    await supabase.auth.signOut({ scope: 'global' });

    // Clear all cookies (this helps with persistent sessions)
    document.cookie.split(';').forEach((cookie) => {
      document.cookie = cookie
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });

    console.log('Auth state cleared successfully');
  } catch (error) {
    console.error('Error clearing auth state:', error);
    throw error;
  }
};

/**
 * Checks if user is currently authenticated with Supabase
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};
