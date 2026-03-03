import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.config';
import { Database } from '../models/database.types';

let supabaseInstance: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(
      env.supabase.url,
      env.supabase.anonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: false,
        },
      }
    );
  }

  return supabaseInstance;
}

export const supabase = getSupabaseClient();
