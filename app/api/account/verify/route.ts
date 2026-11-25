import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/data';
import { COOKIE, codeHash, makeSession, normEmail, validEmail } from '@/lib/account';
import { allow, clientIp, tooMany } from '@/lib/ratelimit';

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = normEmail(b.email);
  const code = String(b.code ?? '').replace(/[^0-9]/g, '');
  if (!validEmail(email) || code.length !== 6) return NextResponse.json({ error: 'Escribe el código de 6 cifras.' }, { status: 400 });
  if (!(await allow(`verify:ip:${clientIp(req)}`, 15, 900))) return tooMany();
  const { data, error } = await supabasePublic!.rpc('verify_login_code', { p_secret: process.env.ORDER_SECRET, p_email: email, p_code_hash: codeHash(email, code) });
  if (error) { console.error('verify_login_code', error); return NextResponse.json({ error: 'Algo ha fallado. Inténtalo de nuevo.' }, { status: 500 }); }
  if (data !== true) return NextResponse.json({ error: 'El código no es correcto o ha caducado. Revisa el email o pide uno nuevo.' }, { status: 401 });
  const s = makeSession(email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, s.value, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: s.maxAge });
  return res;
}
