import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase URL and anon key
export const supabaseUrl = 'https://esmieijbsmvbfnfbulir.supabase.co';
export const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbWllaWpic212YmZuZmJ1bGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxOTI0MDUsImV4cCI6MjA1OTc2ODQwNX0.1BKpCkDqJpNUiyJgH2aUp5aRH-r5Ri5RRdPi978cLVU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
