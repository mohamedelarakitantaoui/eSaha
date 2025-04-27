import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Anon Key. Check your .env file.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
