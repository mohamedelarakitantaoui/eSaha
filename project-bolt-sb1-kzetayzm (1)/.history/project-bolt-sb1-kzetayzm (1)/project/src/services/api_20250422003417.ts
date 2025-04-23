import supabase from '../lib/supabase';

// Define interfaces for API responses
interface ChatMessage {
  _id: string;
  user_id?: string;
  message: string;
  response: string;
  subject: string;
  timestamp: string;
}

interface AuthResponse {
  access_token?: string;
  user?: any;
  error?: string;
}

// Enhanced API service
const API: {
  auth: {
    register: (
      fullName: string,
      email: string,
      password: string
    ) => Promise<AuthResponse>;
    login: (email: string, password: string) => Promise<AuthResponse>;
    resetPassword: (email: string) => Promise<{ error?: string }>;
  };
  chat: {
    sendMessage: (
      token: string,
      message: string,
      subject?: string
    ) => Promise<{ response: string; _id: string }>;
    getHistory: (token: string) => Promise<ChatMessage[]>;
  };
  profile: {
    getProfile: (token: string) => Promise<any>;
    updateProfile: (token: string, updates: any) => Promise<any>;
  };
} = {
  // Authentication services
  auth: {
    /**
     * Register a new user
     */
    register: async (
      fullName: string,
      email: string,
      password: string
    ): Promise<AuthResponse> => {
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
          user: data.user,
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
    login: async (email: string, password: string): Promise<AuthResponse> => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        return {
          access_token: data.session?.access_token,
          user: data.user,
        };
      } catch (error: any) {
        console.error('Login error:', error);
        return {
          error: error.message || 'Login failed',
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
      } catch (error: any) {
        return { error: error.message || 'Password reset failed' };
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
      subject = 'General'
    ): Promise<{ response: string; _id: string }> => {
      try {
        console.log(`Sending message to API: "${message.substring(0, 20)}..."`);

        // For now, we'll implement a simple mock response
        // Replace this with actual API call in production
        const mockResponse = await new Promise<{
          response: string;
          _id: string;
        }>((resolve) => {
          setTimeout(() => {
            resolve({
              response: `Thank you for sharing. I understand you said: "${message}". How can I help you further with this?`,
              _id: Date.now().toString(),
            });
          }, 1000);
        });

        // In production, use this code to call your backend:
        /*
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

        const data = await response.json();
        */

        return mockResponse;
      } catch (error: any) {
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

        // For development/demo purposes, return mock data
        // Replace with actual API call in production
        const mockHistory: ChatMessage[] = [
          {
            _id: '1',
            user_id: 'current-user',
            message: "Hello, I'm feeling a bit anxious today.",
            response:
              "I'm sorry to hear that you're feeling anxious. Would you like to talk about what's causing your anxiety?",
            subject: 'Anxiety',
            timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          },
          {
            _id: '2',
            user_id: 'current-user',
            message:
              "I have a big presentation tomorrow and I'm worried I'll mess up.",
            response:
              "It's completely normal to feel nervous before a presentation. Would you like to explore some techniques that might help reduce your anxiety?",
            subject: 'Anxiety',
            timestamp: new Date(Date.now() - 85000000).toISOString(),
          },
        ];

        // In production, use this code to fetch from your backend:
        /*
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

        const data = await response.json();
        return data;
        */

        return mockHistory;
      } catch (error: any) {
        console.error('Failed to fetch chat history:', error);
        throw error;
      }
    },
  },

  // User profile services
  profile: {
    /**
     * Get user profile
     */
    getProfile: async (token: string): Promise<any> => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) throw error;

        return data.user;
      } catch (error: any) {
        console.error('Failed to get profile:', error);
        throw error;
      }
    },

    /**
     * Update user profile
     */
    updateProfile: async (token: string, updates: any): Promise<any> => {
      try {
        const { data, error } = await supabase.auth.updateUser({
          data: updates,
        });

        if (error) throw error;

        return data.user;
      } catch (error: any) {
        console.error('Failed to update profile:', error);
        throw error;
      }
    },
  },
};

export default API;
