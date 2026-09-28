import { createClient } from '@supabase/supabase-js';

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

export { SUPABASE_URL, SUPABASE_ANON_KEY };

let client = null;
let currentKey = null;

export function getSupabase() {
  if ((!client || currentKey !== SUPABASE_ANON_KEY) && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      currentKey = SUPABASE_ANON_KEY;
    } catch (e) {
      console.warn('Supabase initialization failed:', e);
    }
  }
  return client;
}

export const supabase = getSupabase();
