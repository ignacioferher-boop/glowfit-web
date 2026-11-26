import { NextResponse, type NextRequest } from 'next/server';
import { supabasePublic } from '@/lib/data';
import { APP_COOKIE, madridDay, memberFromCookie } from '@/lib/app-access';

export const dynamic = 'force-dynamic';

// Datos de la app: checklist del día, contenidos y si tiene la guía. También registra la visita y si está instalada.
export async function GET(req: NextRequest) {
  const id = memberFromCookie(req.cookies.get(APP_COOKIE)?.value);
  if (!id || !supabasePublic) return NextResponse.json({ auth: false }, { status: 401 });
  const u = req.nextUrl.searchParams;
  const day = /^\d{4}-\d{2}-\d{2}$/.test(u.get('day') || '') ? u.get('day')! : madridDay();
  const secret = process.env.ORDER_SECRET;
  const [{ data: who }, { data: state, error }] = await Promise.all([
    supabasePublic.rpc('app_ping', { p_secret: secret, p_id: id, p_standalone: u.get('installed') === '1', p_platform: (u.get('platform') || '').slice(0, 40) || null }),
    supabasePublic.rpc('app_state', { p_secret: secret, p_id: id, p_day: day }),
  ]);
  const m = (Array.isArray(who) ? who[0] : who) as { name: string | null; has_guide: boolean; revoked: boolean } | null;
  if (!m || m.revoked) {
    const res = NextResponse.json({ auth: false }, { status: 401 });
    res.cookies.delete(APP_COOKIE);
    return res;
  }
  if (error) { console.error('app_state', error.message); return NextResponse.json({ error: 'No se pudo cargar.' }, { status: 500 }); }
  return NextResponse.json({ auth: true, name: m.name, has_guide: m.has_guide, day, ...(state as object) }, { headers: { 'cache-control': 'no-store' } });
}
