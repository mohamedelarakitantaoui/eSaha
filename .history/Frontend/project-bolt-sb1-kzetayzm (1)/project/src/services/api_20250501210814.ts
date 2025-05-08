import supabase from '../lib/supabase';

// Type Definitions
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  location?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  language?: string;
  timezone?: string;
  theme?: 'light' | 'dark' | 'system';
  notification_preferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface ChatMessage {
  _id: string;
  user_id?: string;
  message: string;
  response: string;
  subject: string;
  session_id?: string;
  timestamp: string;
}

export interface ChatSession {
  _id: string;
  user_id: string;
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  preview?: string;
}

export interface CustomAuthResponse {
  access_token?: string;
  user?: UserProfile | null;
  error?: string;
}

export interface MoodEntry {
  id: string;
  date: string;
  mood:
    | 'very_happy'
    | 'happy'
    | 'neutral'
    | 'sad'
    | 'very_sad'
    | 'anxious'
    | 'angry';
  mood_score: number;
  factors: string[];
  notes?: string;
  source: 'manual' | 'chat_message' | 'check_in';
}

export interface MoodInsights {
  averageMoodScore: number;
  moodDistribution: Record<string, number>;
  topFactors: Array<{ factor: string; count: number }>;
  factorAnalysis: {
    positive: Array<{ factor: string; score: number }>;
    negative: Array<{ factor: string; score: number }>;
  };
  recommendations: string[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  notify_for?: ('crisis' | 'mood_decline' | 'missed_checkin')[];
}

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time?: string;
  type: 'therapy' | 'check_in' | 'support_group' | 'other';
  location?: string;
  reminder_time?: number;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Reminder {
  id: string;
  appointment_id: string;
  title: string;
  appointment_date: string;
  appointment_time: string;
  reminder_time: number;
  status: string;
}

export interface Resource {
  id: string;
  name: string;
  description: string;
  type: 'crisis' | 'support_group' | 'counseling' | 'wellness';
  address?: string;
  phone?: string;
  website?: string;
  hours?: string;
  distance?: number;
}

export interface NotificationPreferences {
  mood_reminders: boolean;
  appointment_reminders: boolean;
  check_in_reminders: boolean;
  mood_insights: boolean;
  resource_recommendations: boolean;
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
                email: data.user.email ?? '',
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
                email: data.user.email ?? '',
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
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to create chat session');
        }

        const sessionData = (await response.json()) as {
          session_id: string;
          created_at: string;
          _id: string;
        };
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
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to fetch chat sessions');
        }

        const sessions = (await response.json()) as ChatSession[];
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
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to send message');
        }

        const data = (await response.json()) as {
          response: string;
          _id: string;
        };

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
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to fetch chat history');
        }

        const chatHistory = (await response.json()) as ChatMessage[];
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
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to fetch session history');
        }

        const chatHistory = (await response.json()) as ChatMessage[];
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
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to get session details');
        }

        const sessionData = (await response.json()) as ChatSession;
        console.log('Received session details:', sessionData);
        return sessionData;
      } catch (error: unknown) {
        console.error('Failed to get session details:', error);
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
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to update session title');
        }

        const data = (await response.json()) as { success: boolean };
        console.log('Title updated successfully:', data);
        return { success: true };
      } catch (error: unknown) {
        console.error('Failed to update session title:', error);
        throw error;
      }
    },
  },

  // Mood tracking services
  mood: {
    /**
     * Get mood entries for a specific time range
     */
    getMoodEntries: async (
      token: string,
      timeRange: 'week' | 'month' | 'year' = 'month'
    ): Promise<MoodEntry[]> => {
      try {
        console.log(`Getting mood entries for time range: ${timeRange}`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch(
          `/api/mood/entries?timeRange=${timeRange}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to fetch mood entries');
        }

        const entries = (await response.json()) as MoodEntry[];
        return entries;
      } catch (error: unknown) {
        console.error('Failed to fetch mood entries:', error);
        throw error;
      }
    },

    /**
     * Create a new mood entry
     */
    createMoodEntry: async (
      token: string,
      entryData: Omit<MoodEntry, 'id' | 'source'>
    ): Promise<MoodEntry> => {
      try {
        console.log(`Creating mood entry`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch('/api/mood/entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(entryData),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to create mood entry');
        }

        const entry = (await response.json()) as MoodEntry;
        return entry;
      } catch (error: unknown) {
        console.error('Failed to create mood entry:', error);
        throw error;
      }
    },

    /**
     * Update a mood entry
     */
    updateMoodEntry: async (
      token: string,
      entryId: string,
      entryData: Partial<Omit<MoodEntry, 'id' | 'source'>>
    ): Promise<MoodEntry> => {
      try {
        console.log(`Updating mood entry: ${entryId}`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch(`/api/mood/entries/${entryId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(entryData),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to update mood entry');
        }

        const entry = (await response.json()) as MoodEntry;
        return entry;
      } catch (error: unknown) {
        console.error('Failed to update mood entry:', error);
        throw error;
      }
    },

    /**
     * Delete a mood entry
     */
    deleteMoodEntry: async (token: string, entryId: string): Promise<void> => {
      try {
        console.log(`Deleting mood entry: ${entryId}`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch(`/api/mood/entries/${entryId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to delete mood entry');
        }
      } catch (error: unknown) {
        console.error('Failed to delete mood entry:', error);
        throw error;
      }
    },

    /**
     * Get mood statistics and insights
     */
    getMoodInsights: async (
      token: string,
      timeRange: 'week' | 'month' | 'year' = 'month'
    ): Promise<MoodInsights> => {
      try {
        console.log(`Getting mood insights for time range: ${timeRange}`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch(
          `/api/mood/insights?timeRange=${timeRange}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to fetch mood insights');
        }

        const insights = (await response.json()) as MoodInsights;
        return insights;
      } catch (error: unknown) {
        console.error('Failed to fetch mood insights:', error);
        throw error;
      }
    },

    /**
     * Export mood data as CSV
     */
    exportMoodData: async (
      token: string,
      format: 'csv' | 'json' = 'csv'
    ): Promise<Blob> => {
      try {
        console.log(`Exporting mood data as ${format}`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch(`/api/mood/export?format=${format}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to export mood data');
        }

        const blob = await response.blob();
        return blob;
      } catch (error: unknown) {
        console.error('Failed to export mood data:', error);
        throw error;
      }
    },
  },

  // Emergency contact services
  emergency: {
    /**
     * Get all emergency contacts
     */
    getContacts: async (token: string): Promise<EmergencyContact[]> => {
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
          const errorData = (await response.json()) as { error: string };
          throw new Error(
            errorData.error || 'Failed to fetch emergency contacts'
          );
        }

        const contacts = (await response.json()) as EmergencyContact[];
        return contacts;
      } catch (error: unknown) {
        console.error('Failed to fetch emergency contacts:', error);
        throw error;
      }
    },

    /**
     * Add a new emergency contact
     */
    addContact: async (
      token: string,
      contactData: Omit<EmergencyContact, 'id'>
    ): Promise<EmergencyContact> => {
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
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to add emergency contact');
        }

        const newContact = (await response.json()) as EmergencyContact;
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
      contactData: Omit<EmergencyContact, 'id'>
    ): Promise<EmergencyContact> => {
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
          const errorData = (await response.json()) as { error: string };
          throw new Error(
            errorData.error || 'Failed to update emergency contact'
          );
        }

        const updatedContact = (await response.json()) as EmergencyContact;
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
          const errorData = (await response.json()) as { error: string };
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
          const errorData = (await response.json()) as { error: string };
          throw new Error(
            errorData.error || 'Failed to trigger emergency alert'
          );
        }

        const result = (await response.json()) as { success: boolean };
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
    getAllAppointments: async (token: string): Promise<Appointment[]> => {
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
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to fetch appointments');
        }

        const appointments = (await response.json()) as Appointment[];
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
      appointmentData: Omit<Appointment, 'id' | 'status'>
    ): Promise<Appointment> => {
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
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to create appointment');
        }

        const appointment = (await response.json()) as Appointment;
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
      appointmentData: Partial<Omit<Appointment, 'id' | 'status'>>
    ): Promise<Appointment> => {
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
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to update appointment');
        }

        const appointment = (await response.json()) as Appointment;
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
    ): Promise<Appointment> => {
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
          const errorData = (await response.json()) as { error: string };
          throw new Error(
            errorData.error || 'Failed to update appointment status'
          );
        }

        const appointment = (await response.json()) as Appointment;
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
          const errorData = (await response.json()) as { error: string };
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
    getReminders: async (token: string): Promise<Reminder[]> => {
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
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to fetch reminders');
        }

        const reminders = (await response.json()) as Reminder[];
        return reminders;
      } catch (error: unknown) {
        console.error('Failed to fetch reminders:', error);
        throw error;
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
    ): Promise<Resource[]> => {
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
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to fetch local resources');
        }

        const resources = (await response.json()) as Resource[];
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
    ): Promise<Resource[]> => {
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
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to search resources');
        }

        const resources = (await response.json()) as Resource[];
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
    ): Promise<Resource> => {
      try {
        // Call backend API
        const response = await fetch(`/api/resources/${resourceId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to get resource details');
        }

        const resource = (await response.json()) as Resource;
        return resource;
      } catch (error: unknown) {
        console.error('Failed to get resource details:', error);
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
        console.log(`Getting user profile`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to fetch user profile');
        }

        const profile = (await response.json()) as UserProfile;
        return profile;
      } catch (error: unknown) {
        console.error('Failed to fetch user profile:', error);
        throw error;
      }
    },

    /**
     * Update user profile
     */
    updateProfile: async (
      token: string,
      profileData: Partial<UserProfile>
    ): Promise<UserProfile> => {
      try {
        console.log(`Updating user profile`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to update user profile');
        }

        const profile = (await response.json()) as UserProfile;
        return profile;
      } catch (error: unknown) {
        console.error('Failed to update user profile:', error);
        throw error;
      }
    },

    /**
     * Get notification preferences
     */
    getNotificationPreferences: async (
      token: string
    ): Promise<NotificationPreferences> => {
      try {
        console.log(`Getting notification preferences`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch('/api/profile/notifications', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(
            errorData.error || 'Failed to fetch notification preferences'
          );
        }

        const preferences = (await response.json()) as NotificationPreferences;
        return preferences;
      } catch (error: unknown) {
        console.error('Failed to fetch notification preferences:', error);
        throw error;
      }
    },

    /**
     * Update notification preferences
     */
    updateNotificationPreferences: async (
      token: string,
      preferencesData: NotificationPreferences
    ): Promise<NotificationPreferences> => {
      try {
        console.log(`Updating notification preferences`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch('/api/profile/notifications', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(preferencesData),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(
            errorData.error || 'Failed to update notification preferences'
          );
        }

        const preferences = (await response.json()) as NotificationPreferences;
        return preferences;
      } catch (error: unknown) {
        console.error('Failed to update notification preferences:', error);
        throw error;
      }
    },

    /**
     * Delete user account
     */
    deleteAccount: async (token: string): Promise<void> => {
      try {
        console.log(`Deleting user account`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch('/api/profile', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to delete account');
        }
      } catch (error: unknown) {
        console.error('Failed to delete account:', error);
        throw error;
      }
    },

    /**
     * Update password
     */
    updatePassword: async (
      token: string,
      currentPassword: string,
      newPassword: string
    ): Promise<void> => {
      try {
        console.log(`Updating password`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch('/api/profile/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to update password');
        }
      } catch (error: unknown) {
        console.error('Failed to update password:', error);
        throw error;
      }
    },

    // Add these new methods to your API.ts file in the services directory

// Enhanced API methods in the mood namespace
const moodApiEnhancements = {
  /**
   * Get mood entries linked to chat messages
   */
  getChatBasedMoodEntries: async (token: string, sessionId?: string): Promise<MoodEntry[]> => {
    try {
      console.log(`Getting chat-based mood entries ${sessionId ? 'for session: ' + sessionId : ''}`);
      console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

      // Construct the URL with optional sessionId filter
      const url = sessionId 
        ? `/api/mood/entries/chat?session_id=${sessionId}`
        : '/api/mood/entries/chat';

      // Call backend API
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error: string };
        throw new Error(errorData.error || 'Failed to fetch chat-based mood entries');
      }

      const entries = (await response.json()) as MoodEntry[];
      return entries;
    } catch (error: unknown) {
      console.error('Failed to fetch chat-based mood entries:', error);
      throw error;
    }
  },

  /**
   * Get mood insights for a specific chat session
   */
  getChatSessionMoodInsights: async (token: string, sessionId: string): Promise<MoodInsights> => {
    try {
      console.log(`Getting mood insights for chat session: ${sessionId}`);
      console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

      // Call backend API
      const response = await fetch(`/api/mood/insights/chat/${sessionId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error: string };
        throw new Error(errorData.error || 'Failed to fetch chat session mood insights');
      }

      const insights = (await response.json()) as MoodInsights;
      return insights;
    } catch (error: unknown) {
      console.error('Failed to fetch chat session mood insights:', error);
      throw error;
    }
  },

  /**
   * Get emotional triggers extracted from chat conversations
   */
  getEmotionalTriggers: async (token: string, timeRange: 'week' | 'month' | 'year' = 'month'): Promise<Array<{ trigger: string; impact: number; frequency: number; }>> => {
    try {
      console.log(`Getting emotional triggers for time range: ${timeRange}`);
      console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

      // Call backend API
      const response = await fetch(`/api/mood/triggers?timeRange=${timeRange}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error: string };
        throw new Error(errorData.error || 'Failed to fetch emotional triggers');
      }

      const triggers = (await response.json()) as Array<{ trigger: string; impact: number; frequency: number; }>;
      return triggers;
    } catch (error: unknown) {
      console.error('Failed to fetch emotional triggers:', error);
      throw error;
    }
  }
};

// Enhanced API methods in the chat namespace
const chatApiEnhancements = {
  /**
   * Get chat sessions with associated mood data
   */
  getSessionsWithMoodData: async (token: string): Promise<Array<ChatSession & { averageMoodScore?: number; dominantMood?: string; }>> => {
    try {
      console.log('Fetching chat sessions with mood data');
      console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

      // Call backend API
      const response = await fetch('/api/chat/sessions/with-mood', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error: string };
        throw new Error(errorData.error || 'Failed to fetch chat sessions with mood data');
      }

      const sessions = (await response.json()) as Array<ChatSession & { averageMoodScore?: number; dominantMood?: string; }>;
      return sessions;
    } catch (error: unknown) {
      console.error('Failed to fetch chat sessions with mood data:', error);
      throw error;
    }
  },

  /**
   * Get messages with associated mood data for a specific session
   */
  getSessionMessagesWithMood: async (token: string, sessionId: string): Promise<Array<ChatMessage & { sentiment?: { mood: string; score: number; } }>> => {
    try {
      console.log(`Getting messages with mood data for session: ${sessionId}`);
      console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

      // Call backend API
      const response = await fetch(`/api/chat/history/${sessionId}/with-mood`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error: string };
        throw new Error(errorData.error || 'Failed to fetch messages with mood data');
      }

      const messages = (await response.json()) as Array<ChatMessage & { sentiment?: { mood: string; score: number; } }>;
      return messages;
    } catch (error: unknown) {
      console.error('Failed to fetch messages with mood data:', error);
      throw error;
    }
  }
};

// To use these enhanced API methods, add them to your existing API object:
/*
// In your API.ts file:
const API = {
  auth: { ... },
  chat: {
    ...existingChatMethods,
    ...chatApiEnhancements
  },
  mood: {
    ...existingMoodMethods,
    ...moodApiEnhancements
  },
  // other namespaces...
};
*/

    /**
     * Export user data
     */
    exportUserData: async (token: string): Promise<Blob> => {
      try {
        console.log(`Exporting user data`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        // Call backend API
        const response = await fetch('/api/profile/export', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to export user data');
        }

        const blob = await response.blob();
        return blob;
      } catch (error: unknown) {
        console.error('Failed to export user data:', error);
        throw error;
      }
    },
  },
};

export default API;
