import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { config } from '../config';

export function createSupabaseClient(): SupabaseClient {
  return createClient(config.supabase.apiUrl, config.supabase.anonKey);
}
