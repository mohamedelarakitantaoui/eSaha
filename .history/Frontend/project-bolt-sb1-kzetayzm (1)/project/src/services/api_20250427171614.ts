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
     * Create a new chat session
     */
    createSession: async (
      token: string,
      sessionId: string,
      title = 'New Chat'
    ): Promise<{
      session_id: string;
      created_at: string;
      _id: string;
    }> => {
      try {
        console.log(`Creating new chat session with ID: ${sessionId}`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call the backend API to create a session
        const response = await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
            title,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create chat session');
        }

        const sessionData = await response.json();
        console.log('Session created successfully:', sessionData);
        return sessionData;
      } catch (error: unknown) {
        console.error('Failed to create chat session:', error);
        throw error;
      }
    },

 // Add these interface definitions to your types.ts file or directly in api.ts

// Interface for chat sessions
interface ChatSession {
  _id: string;
  user_id: string;
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  preview?: string;
}

// Update the chat services section in your API object
// Replace the getSessions method with this properly typed version:

/**
 * Get all chat sessions for the current user
 */
  getSessions: async (token: string): Promise<ChatSession[]> => {
    try {
      console.log('Fetching chat sessions');
      console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

      // Call the backend API to get sessions
      const response = await fetch('/api/chat/sessions', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch chat sessions');
      }

      const sessions = await response.json();
      console.log('Received sessions:', sessions);
      return sessions;
    } catch (error: unknown) {
      console.error('Failed to fetch chat sessions:', error);
      throw error;
      }
  },

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

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        const data = await response.json();

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
    getHistory: async (token: string): Promise<ChatMessage[]> => {
      try {
        console.log('Fetching chat history');
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Make a real API call to the backend
        const response = await fetch('/api/chat/history', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch chat history');
        }

        const chatHistory = await response.json();
        return chatHistory;
      } catch (error: unknown) {
        console.error('Failed to fetch chat history:', error);
        throw error;
      }
    },

    /**
     * Get history for a specific session
     */
    getSessionHistory: async (
      token: string,
      sessionId: string
    ): Promise<ChatMessage[]> => {
      try {
        console.log(`Fetching history for session: ${sessionId}`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Make a real API call to the backend
        const response = await fetch(`/api/chat/history/${sessionId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch session history');
        }

        const chatHistory = await response.json();
        return chatHistory;
      } catch (error: unknown) {
        console.error(
          `Failed to fetch history for session ${sessionId}:`,
          error
        );
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
