import supabase from '../lib/supabase';

interface UserProfile {
  id?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  [key: string]: string | undefined; // More specific than any
}

// Define interfaces for API responses
interface ChatMessage {
  _id: string;
  user_id?: string;
  message: string;
  response: string;
  subject: string;
  session_id?: string;
  timestamp: string;
}

interface CustomAuthResponse {
  access_token?: string;
  user?: UserProfile | null; // Allow for null
  error?: string;
}

// Enhanced API service
const API = {
  // Authentication services
  auth: {
    /**
     * Register a new user
     */
    register: async (
      fullName: string,
      email: string,
      password: string
    ): Promise<CustomAuthResponse> => {
      try {
        // Register with Supabase
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        return {
          access_token: data.session?.access_token,
          user: data.user
            ? {
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.user_metadata?.full_name as
                  | string
                  | undefined,
                avatar_url: data.user.user_metadata?.avatar_url as
                  | string
                  | undefined,
              }
            : null,
        };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Registration failed';
        console.error('Registration error:', error);
        return {
          error: errorMessage,
        };
      }
    },

    /**
     * Login a user
     */
    login: async (
      email: string,
      password: string
    ): Promise<CustomAuthResponse> => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        return {
          access_token: data.session?.access_token,
          user: data.user
            ? {
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.user_metadata?.full_name as
                  | string
                  | undefined,
                avatar_url: data.user.user_metadata?.avatar_url as
                  | string
                  | undefined,
              }
            : null,
        };
      } catch (error: unknown) {
        console.error('Login error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Login failed';
        return {
          error: errorMessage,
        };
      }
    },

    /**
     * Reset password
     */
    resetPassword: async (email: string): Promise<{ error?: string }> => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        return {};
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Password reset failed';
        return { error: errorMessage };
      }
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
      subject = 'General',
      sessionId?: string
    ): Promise<{ response: string; _id: string }> => {
      try {
        console.log(`Sending message to API: "${message.substring(0, 20)}..."`);
        console.log(`Using token (partial): ${token.substring(0, 10)}...`);
        console.log(`Subject: ${subject}`);
        console.log(`Session ID: ${sessionId || 'Not provided'}`);

        // Build request body
        const requestBody: {
          message: string;
          subject: string;
          session_id?: string;
        } = {
          message,
          subject,
        };

        // Include session ID if provided
        if (sessionId) {
          requestBody.session_id = sessionId;
          console.log('Including session_id in request:', sessionId);
        } else {
          console.warn('No session_id provided for chat request');
        }

        // Make an actual API call to our backend
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        // Log the raw response for debugging
        console.log('API Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || 'Failed to send message');
          } catch (e) {
            throw new Error(`Failed to send message: ${errorText}`);
          }
        }

        const data = await response.json();
        console.log('Parsed API response:', data);

        // Return the response from the server
        return {
          response: data.response,
          _id: data._id || Date.now().toString(), // Use server-provided ID or generate one
        };
      } catch (error: unknown) {
        console.error('Error sending message:', error);
        throw error;
      }
    },

    /**
     * Get chat history
     */
    getHistory: async (
      token: string,
      sessionId?: string
    ): Promise<ChatMessage[]> => {
      try {
        console.log('Fetching chat history');
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Build the URL with optional sessionId parameter
        let url = '/api/chat/history';
        if (sessionId) {
          url = `/api/chat/history/${sessionId}`;
          console.log(`Fetching history for specific session: ${sessionId}`);
        }

        // Make a real API call to the backend
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Log the raw response for debugging
        console.log('History API Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || 'Failed to fetch chat history');
          } catch (e) {
            throw new Error(`Failed to fetch chat history: ${errorText}`);
          }
        }

        const chatHistory = await response.json();
        console.log(`Received ${chatHistory.length} messages from history`);
        return chatHistory;
      } catch (error: unknown) {
        console.error('Failed to fetch chat history:', error);
        throw error;
      }
    },

    /**
     * Get all chat sessions for the user
     */
    getSessions: async (token: string): Promise<any[]> => {
      try {
        console.log('Fetching chat sessions');

        const response = await fetch('/api/chat/sessions', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch chat sessions');
        }

        const sessions = await response.json();
        console.log(`Received ${sessions.length} chat sessions`);
        return sessions;
      } catch (error: unknown) {
        console.error('Failed to fetch chat sessions:', error);
        throw error;
      }
    },

    /**
     * Create a new chat session
     */
    createSession: async (token: string, title: string): Promise<any> => {
      try {
        console.log(`Creating new chat session with title: "${title}"`);

        const response = await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create chat session');
        }

        const session = await response.json();
        console.log('Created new session:', session);
        return session;
      } catch (error: unknown) {
        console.error('Failed to create chat session:', error);
        throw error;
      }
    },
  },

  // User profile services
  profile: {
    /**
     * Get user profile
     */
    getProfile: async (token: string): Promise<UserProfile> => {
      try {
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);
        const { data, error } = await supabase.auth.getUser();

        if (error) throw error;

        const userData = data.user;
        return {
          id: userData.id,
          email: userData.email,
          full_name: userData.user_metadata?.full_name as string | undefined,
          avatar_url: userData.user_metadata?.avatar_url as string | undefined,
        };
      } catch (error: unknown) {
        console.error('Failed to get profile:', error);
        throw error;
      }
    },

    /**
     * Update user profile
     */
    updateProfile: async (
      token: string,
      updates: Partial<UserProfile>
    ): Promise<UserProfile> => {
      try {
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);
        const { data, error } = await supabase.auth.updateUser({
          data: updates,
        });

        if (error) throw error;

        const userData = data.user;
        return {
          id: userData.id,
          email: userData.email,
          full_name: userData.user_metadata?.full_name as string | undefined,
          avatar_url: userData.user_metadata?.avatar_url as string | undefined,
        };
      } catch (error: unknown) {
        console.error('Failed to update profile:', error);
        throw error;
      }
    },
  },
};

export default API;
