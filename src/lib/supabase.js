import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = "https://bahikfjsschmlvaazdub.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_KGf-IEh-nVV5yKkWHWV9RA_7q46OHcS";

let client = null;

export function getSupabase() {
  if (!client && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
      console.warn('Supabase initialization failed:', e);
    }
  }
  return client;
}

export const supabase = getSupabase();
