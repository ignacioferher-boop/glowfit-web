import { NextResponse, type NextRequest } from 'next/server';
import { supabasePublic } from '@/lib/data';
import { APP_COOKIE, memberFromCookie } from '@/lib/app-access';

// Marca o desmarca un hábito de la checklist del día.
export async function POST(req: NextRequest) {
  const id = memberFromCookie(req.cookies.get(APP_COOKIE)?.value);
  if (!id || !supabasePublic) return NextResponse.json({ error: 'Vuelve a entrar con tu código.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const item = String(b.item || ''); const day = String(b.day || '');
  if (!/^[0-9a-f-]{36}$/i.test(item) || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return NextResponse.json({ error: 'Datos no válidos.' }, { status: 400 });
  const { error } = await supabasePublic.rpc('app_toggle', { p_secret: process.env.ORDER_SECRET, p_id: id, p_day: day, p_item: item, p_done: !!b.done });
  if (error) { console.error('app_toggle', error.message); return NextResponse.json({ error: 'No se pudo guardar.' }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
