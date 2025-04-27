import supabase from '../lib/supabase';

interface UserProfile {
  id?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  [key: string]: string | undefined;
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

interface CustomAuthResponse {
  access_token?: string;
  user?: UserProfile | null;
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
     * Get details for a specific chat session
     */
    getSessionDetails: async (
      token: string,
      sessionId: string
    ): Promise<ChatSession> => {
      try {
        console.log(`Getting session details for: ${sessionId}`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);
        // Call the backend API to get session details
        const response = await fetch(`/api/chat/sessions/${sessionId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get session details');
        }
        const sessionData = await response.json();
        console.log('Received session details:', sessionData);
        return sessionData;
      } catch (error: unknown) {
        console.error('Failed to get session details:', error);
        throw error;
      }
    },

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
            Authorization: `Bearer ${token}`,
          },
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

    /**
     * Update a chat session title
     */
    updateSessionTitle: async (
      token: string,
      sessionId: string,
      title: string
    ): Promise<{ success: boolean }> => {
      try {
        console.log(`Updating session title for: ${sessionId}`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call the backend API to update the session title
        const response = await fetch(`/api/chat/sessions/${sessionId}/title`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update session title');
        }

        const data = await response.json();
        console.log('Title updated successfully:', data);
        return { success: true };
      } catch (error: unknown) {
        console.error('Failed to update session title:', error);
        throw error;
      }
    },

    /**
     * Delete a chat session
     */
    deleteSession: async (
      token: string,
      sessionId: string
    ): Promise<{ success: boolean }> => {
      try {
        console.log(`Deleting session: ${sessionId}`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call the backend API to delete the session
        const response = await fetch(`/api/chat/sessions/${sessionId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete session');
        }

        console.log('Session deleted successfully');
        return { success: true };
      } catch (error: unknown) {
        console.error('Failed to delete session:', error);
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

    /**
     * Change user password
     */
    changePassword: async (
      token: string,
      currentPassword: string,
      newPassword: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // First verify the current password by trying to sign in
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: '', // We'll need to get the email from the current session
          password: currentPassword,
        });

        if (verifyError) {
          return {
            success: false,
            error: 'Current password is incorrect',
          };
        }

        // Update the password
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) throw error;

        return { success: true };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to change password';
        console.error('Failed to change password:', error);
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
  },

  // Resources services
  resources: {
    /**
     * Get local mental health resources
     */
    getLocalResources: async (
      token: string,
      location: string
    ): Promise<any[]> => {
      try {
        console.log(`Getting resources for location: ${location}`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);
        // Call backend API
        const response = await fetch(
          `/api/resources?location=${encodeURIComponent(location)}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch local resources');
        }
        const resources = await response.json();
        return resources;
      } catch (error: unknown) {
        console.error('Failed to fetch local resources:', error);
        throw error;
      }
    },
    /**
     * Search for resources with filters
     */
    searchResources: async (
      token: string,
      params: {
        location?: string;
        type?: string;
        keyword?: string;
        distance?: number;
      }
    ): Promise<any[]> => {
      try {
        // Build query string from params
        const queryParams = new URLSearchParams();
        if (params.location) queryParams.append('location', params.location);
        if (params.type) queryParams.append('type', params.type);
        if (params.keyword) queryParams.append('keyword', params.keyword);
        if (params.distance)
          queryParams.append('distance', params.distance.toString());
        const queryString = queryParams.toString();

        // Call backend API
        const response = await fetch(`/api/resources/search?${queryString}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to search resources');
        }
        const resources = await response.json();
        return resources;
      } catch (error: unknown) {
        console.error('Failed to search resources:', error);
        throw error;
      }
    },
    /**
     * Get details for a specific resource
     */
    getResourceDetails: async (
      token: string,
      resourceId: string
    ): Promise<any> => {
      try {
        // Call backend API
        const response = await fetch(`/api/resources/${resourceId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get resource details');
        }
        const resource = await response.json();
        return resource;
      } catch (error: unknown) {
        console.error('Failed to get resource details:', error);
        throw error;
      }
    },
  },

  // Emergency contact services
  emergency: {
    /**
     * Get all emergency contacts
     */
    getContacts: async (token: string): Promise<any[]> => {
      try {
        console.log(`Getting emergency contacts`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch('/api/emergency/contacts', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Failed to fetch emergency contacts'
          );
        }

        const contacts = await response.json();
        return contacts;
      } catch (error: unknown) {
        console.error('Failed to fetch emergency contacts:', error);
        throw error;
      }
    },

    /**
     * Add a new emergency contact
     */
    addContact: async (token: string, contactData: any): Promise<any> => {
      try {
        console.log(`Adding emergency contact`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch('/api/emergency/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(contactData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add emergency contact');
        }

        const newContact = await response.json();
        return newContact;
      } catch (error: unknown) {
        console.error('Failed to add emergency contact:', error);
        throw error;
      }
    },

    /**
     * Update an emergency contact
     */
    updateContact: async (
      token: string,
      contactId: string,
      contactData: any
    ): Promise<any> => {
      try {
        console.log(`Updating emergency contact: ${contactId}`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch(`/api/emergency/contacts/${contactId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(contactData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Failed to update emergency contact'
          );
        }

        const updatedContact = await response.json();
        return updatedContact;
      } catch (error: unknown) {
        console.error('Failed to update emergency contact:', error);
        throw error;
      }
    },

    /**
     * Delete an emergency contact
     */
    deleteContact: async (token: string, contactId: string): Promise<void> => {
      try {
        console.log(`Deleting emergency contact: ${contactId}`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch(`/api/emergency/contacts/${contactId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Failed to delete emergency contact'
          );
        }
      } catch (error: unknown) {
        console.error('Failed to delete emergency contact:', error);
        throw error;
      }
    },

    /**
     * Trigger an emergency alert to contacts
     */
    triggerAlert: async (token: string): Promise<{ success: boolean }> => {
      try {
        console.log(`Triggering emergency alert`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch('/api/emergency/alert', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Failed to trigger emergency alert'
          );
        }

        const result = await response.json();
        return result;
      } catch (error: unknown) {
        console.error('Failed to trigger emergency alert:', error);
        throw error;
      }
    },
  },

  // Appointments services
  appointments: {
    /**
     * Get all appointments
     */
    getAllAppointments: async (token: string): Promise<any[]> => {
      try {
        console.log(`Getting all appointments`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch('/api/appointments', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch appointments');
        }

        const appointments = await response.json();
        return appointments;
      } catch (error: unknown) {
        console.error('Failed to fetch appointments:', error);
        throw error;
      }
    },

    /**
     * Create a new appointment
     */
    createAppointment: async (
      token: string,
      appointmentData: any
    ): Promise<any> => {
      try {
        console.log(`Creating appointment`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(appointmentData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create appointment');
        }

        const appointment = await response.json();
        return appointment;
      } catch (error: unknown) {
        console.error('Failed to create appointment:', error);
        throw error;
      }
    },

    /**
     * Update an appointment
     */
    updateAppointment: async (
      token: string,
      appointmentId: string,
      appointmentData: any
    ): Promise<any> => {
      try {
        console.log(`Updating appointment: ${appointmentId}`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch(`/api/appointments/${appointmentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(appointmentData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update appointment');
        }

        const appointment = await response.json();
        return appointment;
      } catch (error: unknown) {
        console.error('Failed to update appointment:', error);
        throw error;
      }
    },

    /**
     * Update appointment status
     */
    updateAppointmentStatus: async (
      token: string,
      appointmentId: string,
      status: 'scheduled' | 'completed' | 'cancelled'
    ): Promise<any> => {
      try {
        console.log(
          `Updating appointment status: ${appointmentId} to ${status}`
        );
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch(
          `/api/appointments/${appointmentId}/status`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Failed to update appointment status'
          );
        }

        const appointment = await response.json();
        return appointment;
      } catch (error: unknown) {
        console.error('Failed to update appointment status:', error);
        throw error;
      }
    },

    /**
     * Delete an appointment
     */
    deleteAppointment: async (
      token: string,
      appointmentId: string
    ): Promise<void> => {
      try {
        console.log(`Deleting appointment: ${appointmentId}`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch(`/api/appointments/${appointmentId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete appointment');
        }
      } catch (error: unknown) {
        console.error('Failed to delete appointment:', error);
        throw error;
      }
    },

    /**
     * Get appointment reminders for the current user
     */
    getReminders: async (token: string): Promise<any[]> => {
      try {
        console.log(`Getting appointment reminders`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch('/api/appointments/reminders', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch reminders');
        }

        const reminders = await response.json();
        return reminders;
      } catch (error: unknown) {
        console.error('Failed to fetch reminders:', error);
        throw error;
      }
    },
  },
};

export default API;
