import { supabase } from '../lib/supabase';
// Import mock utilities for development/testing
import {
  mockGetAvailableDates,
  mockGetAvailableTimeSlots,
} from '../utils/mockUtils';

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

// Extended Appointment interface with specialist details
export interface Appointment {
  id: string;
  user_id: string;
  specialist_id?: string;
  specialist_name?: string;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time?: string;
  type: 'therapy' | 'check_in' | 'support_group' | 'other';
  location?: string;
  reminder_time?: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
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

// Specialist interface
export interface Specialist {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  description: string;
  availability: string; // General availability status
  nextAvailable: string; // Text representation of next available slot
  rating: number;
  reviews: number;
  price: string;
  imageUrl: string;
  location?: string;
  phone?: string;
  email?: string;
  website?: string;
  weekly_availability?: SpecialistAvailability[]; // Added for scheduling
  time_off?: SpecialistTimeOff[]; // Added for scheduling
}

// Specialist Availability (recurring weekly schedule)
export interface SpecialistAvailability {
  id: string;
  specialist_id: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
  start_time: string; // Format: "HH:MM" in 24-hour format
  end_time: string; // Format: "HH:MM" in 24-hour format
  is_active: boolean; // To allow temporary disabling of time slots
  created_at: string;
  updated_at: string;
}

// Specialist Time Off (vacations, days off, etc.)
export interface SpecialistTimeOff {
  id: string;
  specialist_id: string;
  date: string; // Format: "YYYY-MM-DD"
  reason?: string; // Optional reason for time off
  created_at: string;
  updated_at: string;
}

// Available Time Slot (for frontend display)
export interface TimeSlot {
  id: string; // Generated client-side as date + time
  specialist_id: string;
  date: string; // Format: "YYYY-MM-DD"
  start_time: string; // Format: "HH:MM"
  end_time: string; // Format: "HH:MM"
  is_available: boolean;
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
        // Show the request we're about to make
        console.log(
          'Request payload:',
          JSON.stringify({
            session_id: sessionId,
            title,
          })
        );
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
        console.log(`Response status: ${response.status}`);

        // Handle non-OK responses with more detail
        if (!response.ok) {
          let errorText;
          try {
            const errorData = await response.json();
            errorText = JSON.stringify(errorData);
          } catch {
            errorText = await response.text();
          }

          console.error(`Error response (${response.status}): ${errorText}`);
          throw new Error(
            `Failed to create chat session: ${response.status} - ${errorText}`
          );
        }
        const sessionData = await response.json();
        console.log('Session created successfully:', sessionData);
        return sessionData;
      } catch (error) {
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

        // Extra logging for troubleshooting
        console.log('Request headers:', {
          Authorization: `Bearer ${token.substring(0, 10)}...`,
        });
        // Call the backend API to get sessions
        const response = await fetch('/api/chat/sessions', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log(`Response status: ${response.status}`);
        console.log(
          `Response headers:`,
          Object.fromEntries([...response.headers.entries()])
        );

        if (!response.ok) {
          let errorText;
          try {
            const errorData = await response.json();
            errorText = JSON.stringify(errorData);
          } catch {
            errorText = await response.text();
          }

          console.error(`Error response (${response.status}): ${errorText}`);
          throw new Error(
            `Failed to fetch chat sessions: ${response.status} - ${errorText}`
          );
        }
        const sessions = await response.json();
        console.log('Received sessions data type:', typeof sessions);
        console.log('Sessions array?', Array.isArray(sessions));
        console.log(
          'Received sessions count:',
          Array.isArray(sessions) ? sessions.length : 'not an array'
        );

        if (Array.isArray(sessions) && sessions.length > 0) {
          console.log('First session example:', sessions[0]);
        }

        return sessions;
      } catch (error) {
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

  // Specialist services
  specialists: {
    /**
     * Get a specialist by ID
     */
    getSpecialistById: async (
      token: string,
      specialistId: string
    ): Promise<Specialist> => {
      try {
        console.log(`Getting specialist details for: ${specialistId}`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        const response = await fetch(`/api/specialists/${specialistId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(
            errorData.error || 'Failed to fetch specialist details'
          );
        }

        const specialist = (await response.json()) as Specialist;
        return specialist;
      } catch (error: unknown) {
        console.error('Failed to fetch specialist details:', error);
        throw error;
      }
    },

    /**
     * Get all specialists
     */
    getAllSpecialists: async (token: string): Promise<Specialist[]> => {
      try {
        console.log(`Getting all specialists`);
        console.log(`Using auth token (partial): ${token.substring(0, 10)}...`);

        const response = await fetch(`/api/specialists`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to fetch specialists');
        }

        const specialists = (await response.json()) as Specialist[];
        return specialists;
      } catch (error: unknown) {
        console.error('Failed to fetch specialists:', error);
        throw error;
      }
    },

    /**
     * Get a specialist's weekly availability schedule
     */
    getSpecialistAvailability: async (
      token: string,
      specialistId: string
    ): Promise<SpecialistAvailability[]> => {
      try {
        console.log(`Getting availability for specialist: ${specialistId}`);

        const response = await fetch(
          `/api/specialists/${specialistId}/availability`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(
            errorData.error || 'Failed to fetch specialist availability'
          );
        }

        const availability =
          (await response.json()) as SpecialistAvailability[];
        return availability;
      } catch (error: unknown) {
        console.error('Failed to fetch specialist availability:', error);
        throw error;
      }
    },

    /**
     * Get available time slots for a specific date
     */
    getAvailableTimeSlots: async (
      token: string,
      specialistId: string,
      date: string
    ): Promise<TimeSlot[]> => {
      try {
        console.log(
          `Getting time slots for specialist ${specialistId} on ${date}`
        );

        // For development/testing, use the mock data
        // TODO: Replace with real API call when backend is ready
        return await mockGetAvailableTimeSlots(specialistId, date);

        /* Real API implementation would look like this:
        const response = await fetch(
          `/api/specialists/${specialistId}/available-slots?date=${date}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to fetch available time slots');
        }

        const timeSlots = (await response.json()) as TimeSlot[];
        return timeSlots;
        */
      } catch (error: unknown) {
        console.error('Failed to fetch available time slots:', error);
        throw error;
      }
    },

    /**
     * Get available dates for the current month
     */
    getAvailableDates: async (
      token: string,
      specialistId: string,
      year: number,
      month: number
    ): Promise<string[]> => {
      try {
        console.log(
          `Getting available dates for specialist ${specialistId} for ${month}/${year}`
        );

        // For development/testing, use the mock data
        // TODO: Replace with real API call when backend is ready
        return await mockGetAvailableDates(specialistId, year, month);

        /* Real API implementation would look like this:
        const response = await fetch(
          `/api/specialists/${specialistId}/available-dates?year=${year}&month=${month}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(errorData.error || 'Failed to fetch available dates');
        }

        const dates = (await response.json()) as string[];
        return dates;
        */
      } catch (error: unknown) {
        console.error('Failed to fetch available dates:', error);
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
     * Book a new appointment with a specialist
     */
    bookAppointment: async (
      token: string,
      appointmentData: {
        specialist_id: string;
        date: string;
        start_time: string;
        end_time?: string;
        title?: string;
        description?: string;
        type?: 'therapy' | 'check_in' | 'support_group' | 'other';
        location?: string;
        reminder_time?: number;
      }
    ): Promise<Appointment> => {
      try {
        console.log(
          `Booking appointment with specialist ${appointmentData.specialist_id}`
        );
        console.log(
          `Date: ${appointmentData.date}, Time: ${appointmentData.start_time}`
        );

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
          throw new Error(errorData.error || 'Failed to book appointment');
        }

        const appointment = (await response.json()) as Appointment;
        console.log('Appointment booked successfully:', appointment);
        return appointment;
      } catch (error: unknown) {
        console.error('Failed to book appointment:', error);
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

    /**
     * Get appointments by specialist ID
     */
    getAppointmentsBySpecialist: async (
      token: string,
      specialistId: string
    ): Promise<Appointment[]> => {
      try {
        console.log(`Getting appointments for specialist: ${specialistId}`);

        const response = await fetch(
          `/api/appointments/specialist/${specialistId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = (await response.json()) as { error: string };
          throw new Error(
            errorData.error || 'Failed to fetch specialist appointments'
          );
        }

        const appointments = (await response.json()) as Appointment[];
        return appointments;
      } catch (error: unknown) {
        console.error('Failed to fetch specialist appointments:', error);
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
