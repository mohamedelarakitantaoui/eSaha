import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://esmieijbsmvbfnfbulir.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbWllaWpic212YmZuZmJ1bGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxOTI0MDUsImV4cCI6MjA1OTc2ODQwNX0.1BKpCkDqJpNUiyJgH2aUp5aRH-r5Ri5RRdPi978cLVU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
