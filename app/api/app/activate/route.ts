import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/data';
import { APP_COOKIE, cookieOptions, sessionValue } from '@/lib/app-access';
import { allow, clientIp, tooMany } from '@/lib/ratelimit';

// Activa la app (o entra en otro móvil) con el código personal del email.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const code = String(b.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!(await allow(`app:activate:${clientIp(req)}`, 10, 900))) return tooMany();
  if (code.length < 8 || !supabasePublic) return NextResponse.json({ error: 'Revisa el código: tiene este formato GLOW-XXXX-XXXX.' }, { status: 400 });
  const formatted = code.startsWith('GLOW') ? `GLOW-${code.slice(4, 8)}-${code.slice(8, 12)}` : code;
  const { data, error } = await supabasePublic.rpc('app_activate', { p_secret: process.env.ORDER_SECRET, p_code: formatted });
  if (error) { console.error('app_activate', error.message); return NextResponse.json({ error: 'No hemos podido comprobar el código. Inténtalo en un momento.' }, { status: 500 }); }
  const r = (Array.isArray(data) ? data[0] : data) as { status: string; id: string | null; name: string | null } | null;
  const msg: Record<string, string> = {
    invalid: 'Ese código no existe. Cópialo tal cual aparece en tu email.',
    expired: 'Este código ha caducado (había 30 días para activarlo). Escríbenos y te enviamos uno nuevo.',
    revoked: 'Este acceso está desactivado. Escríbenos si crees que es un error.',
  };
  if (!r || r.status !== 'ok' || !r.id) return NextResponse.json({ error: msg[r?.status || 'invalid'] || msg.invalid }, { status: 403 });
  const res = NextResponse.json({ ok: true, name: r.name });
  res.cookies.set(APP_COOKIE, sessionValue(r.id), cookieOptions);
  return res;
}
