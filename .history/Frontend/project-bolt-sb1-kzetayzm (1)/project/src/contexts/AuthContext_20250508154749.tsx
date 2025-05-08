import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../services/api';

// Define the AuthContext type
export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  accessToken: string | null; // Add accessToken property
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  accessToken: null, // Add default value for accessToken
  signIn: async () => ({ error: 'Not implemented' }),
  signUp: async () => ({ error: 'Not implemented' }),
  signOut: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          // Get user data from session
          const { user } = session;

          // Set access token
          setAccessToken(session.access_token);

          // Transform Supabase user to our UserProfile type
          if (user) {
            setUser({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name as string | undefined,
              avatar_url: user.user_metadata?.avatar_url as string | undefined,
            });
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Update user on auth change
        const { user } = session;

        // Set access token
        setAccessToken(session.access_token);

        if (user) {
          setUser({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name as string | undefined,
            avatar_url: user.user_metadata?.avatar_url as string | undefined,
          });
        }
      } else {
        // Clear user and token on sign out
        setUser(null);
        setAccessToken(null);
      }

      setLoading(false);
    });

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error.message);
        return { error: error.message };
      }

      // Successfully signed in, update auth state
      if (data.session) {
        setAccessToken(data.session.access_token);
      }

      return {};
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred during sign in',
      };
    }
  };

  // Sign up function
  const signUp = async (fullName: string, email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('Sign up error:', error.message);
        return { error: error.message };
      }

      // Check if email confirmation is required
      if (!data.session) {
        return { error: 'Please check your email to confirm your account' };
      }

      // Successfully signed up and logged in
      if (data.session) {
        setAccessToken(data.session.access_token);
      }

      return {};
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred during sign up',
      };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAccessToken(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Auth context value
  const contextValue: AuthContextType = {
    user,
    loading,
    accessToken,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
