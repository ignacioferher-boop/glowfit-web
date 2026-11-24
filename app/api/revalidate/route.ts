import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// Refresca la web al momento tras un cambio en el panel. Solo para administradores.
export async function POST(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vwyvmqsxiazcrhjdiucm.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_zSxDEjhUgDLaLDBJDVFvXg_rYGeW7Qi';
  const client = createClient(url, key, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.rpc('is_admin');
  if (error || data !== true) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
