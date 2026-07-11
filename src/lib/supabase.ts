import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export interface AttendanceLog {
  id: string;
  name: string;
  email: string;
  login_time: string; // ISO timestamp
  logout_time: string | null; // ISO timestamp
  date: string; // YYYY-MM-DD
  status: 'logged_in' | 'logged_out';
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Warning: Supabase environment variables are missing. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
