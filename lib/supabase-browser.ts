'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let client: SupabaseClient | null = null;
export function sb() {
  if (!client) client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vwyvmqsxiazcrhjdiucm.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_zSxDEjhUgDLaLDBJDVFvXg_rYGeW7Qi',
    { auth: { persistSession: true, storageKey: 'glowfit-admin' } },
  );
  return client;
}
