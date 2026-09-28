import { createClient } from '@supabase/supabase-js';

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

export { SUPABASE_URL, SUPABASE_ANON_KEY };

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
