import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Re-export types from shared types file
export type {
  Assignment,
  Question,
  Submission,
  CreateAssignmentInput,
  CreateSubmissionInput,
} from '@/types';

// Lazy-initialized Supabase client
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables are not set');
    }
    
    _supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// For backwards compatibility - this will throw at runtime if env vars are missing
export const supabase = {
  from: (table: string) => getSupabase().from(table),
};

