import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vwyvmqsxiazcrhjdiucm.supabase.co';
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_zSxDEjhUgDLaLDBJDVFvXg_rYGeW7Qi';

// Comprueba que la petición viene de un administrador del panel. Devuelve un cliente con sus permisos o null.
export async function adminFromRequest(req: Request): Promise<SupabaseClient | null> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const db = createClient(URL_, KEY, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data } = await db.rpc('is_admin');
  return data === true ? db : null;
}
