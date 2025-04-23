import {
  User as SupabaseUser,
  Session,
  AuthError,
} from '@supabase/supabase-js';

// Export the Supabase types directly
export type { SupabaseUser, Session, AuthError };

// Define additional types used in the application
export interface ChatMessage {
  _id: string;
  user_id?: string;
  message: string;
  response: string;
  subject: string;
  timestamp: string;
  pending?: boolean;
}
