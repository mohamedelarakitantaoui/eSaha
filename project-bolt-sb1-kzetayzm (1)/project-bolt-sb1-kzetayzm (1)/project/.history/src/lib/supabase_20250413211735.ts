import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase URL and anon key
export const supabaseUrl = 'YOUR_SUPABASE_URL';
export const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
