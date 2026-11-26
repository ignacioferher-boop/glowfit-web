import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/data';
import { contactEmail, sendEmail } from '@/lib/email';
import { LEGAL } from '@/lib/legal';
import { allow, clientIp, tooMany } from '@/lib/ratelimit';
import { notifyAdmins } from '@/lib/push';
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (b.website) return NextResponse.json({ ok: true }); // trampa anti-spam
  const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const row = { name: `${s(b.first_name, 80)} ${s(b.last_name, 120)}`.trim(), email: s(b.email, 200), phone: s(b.phone, 40), message: s(b.message, 4000) };
  if (!row.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email) || !row.message) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  if (!(await allow(`contact:ip:${clientIp(req)}`, 5, 3600))) return tooMany('Has enviado varios mensajes seguidos. Espera un rato o escríbenos por email.');
  let { error } = await supabasePublic!.rpc('submit_contact', { p_secret: process.env.ORDER_SECRET, p_name: row.name, p_email: row.email, p_phone: row.phone, p_message: row.message });
  if (error?.code === 'PGRST202') ({ error } = await supabasePublic!.from('contact_messages').insert(row));
  if (error) { console.error('contact', error.message); return NextResponse.json({ error: 'No hemos podido enviar tu mensaje. Inténtalo de nuevo.' }, { status: 500 }); }
  // Aviso por email al buzón de contacto (si Resend está configurado)
  await sendEmail(LEGAL.email, contactEmail(row), row.email).catch((e) => console.error('contact mail', e));
  await notifyAdmins({ title: `✉️ Mensaje de ${row.name.split(' ')[0]}`, body: row.message.slice(0, 140), tag: 'contact' });
  return NextResponse.json({ ok: true });
}
