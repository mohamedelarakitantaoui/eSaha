import supabase from '../lib/supabase';

// API service for backend communication
const API = {
  // Authentication services
  auth: {
    /**
     * Register a new user
     */
    register: async (username: string, email: string, password: string) => {
      // First, register with Supabase
      const { error: supabaseError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Then register with our backend
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Registration failed');
      }

      return await response.json();
    },

    /**
     * Login a user
     */
    login: async (email: string, password: string) => {
      // First try Supabase login
      const { data: supabaseData, error: supabaseError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (supabaseError) {
        // Fall back to legacy login
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.msg || 'Login failed');
        }

        return await response.json();
      }

      return {
        access_token: supabaseData.session?.access_token,
        user: supabaseData.user,
      };
    },
  },

  // Chat services
  chat: {
    /**
     * Send a message to the AI
     */
    sendMessage: async (
      token: string,
      message: string,
      subject = 'General'
    ) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, subject }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send message: ${errorText}`);
      }

      return await response.json();
    },

    /**
     * Get chat history
     */
    getHistory: async (token: string) => {
      const response = await fetch('/api/chat/history', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get chat history: ${errorText}`);
      }

      return await response.json();
    },
  },
};

export default API;
