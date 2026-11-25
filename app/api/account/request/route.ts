import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/data';
import { codeHash, newCode, normEmail, validEmail } from '@/lib/account';
import { loginCodeEmail, sendEmail } from '@/lib/email';
import { allow, clientIp, tooMany } from '@/lib/ratelimit';

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = normEmail(b.email);
  if (!validEmail(email)) return NextResponse.json({ error: 'Escribe un email válido.' }, { status: 400 });
  if (!process.env.ORDER_SECRET || !process.env.RESEND_API_KEY) return NextResponse.json({ error: 'El acceso a tu cuenta estará disponible muy pronto.' }, { status: 503 });
  if (!(await allow(`code:ip:${clientIp(req)}`, 10, 900))) return tooMany();
  const code = newCode();
  const { data, error } = await supabasePublic!.rpc('create_login_code', { p_secret: process.env.ORDER_SECRET, p_email: email, p_code_hash: codeHash(email, code) });
  if (error) { console.error('create_login_code', error); return NextResponse.json({ error: 'No hemos podido enviarte el código. Inténtalo de nuevo.' }, { status: 500 }); }
  if (data === false) return NextResponse.json({ error: 'Has pedido demasiados códigos. Espera unos minutos y vuelve a intentarlo.' }, { status: 429 });
  const ok = await sendEmail(email, loginCodeEmail(code));
  if (!ok) return NextResponse.json({ error: 'No hemos podido enviarte el código. Inténtalo de nuevo.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
