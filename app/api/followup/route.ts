import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/data';
import { validFollowupToken } from '@/lib/followup';
import { followupNewReplyShopEmail, sendEmail } from '@/lib/email';
import { allow, clientIp, tooMany } from '@/lib/ratelimit';

// El cliente contesta al seguimiento (o pide no recibir más) desde el enlace firmado del email.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const o = String(b.o || ''); const t = String(b.t || '');
  if (!validFollowupToken(o, t) || !supabasePublic) return NextResponse.json({ error: 'El enlace no es válido. Usa el del email que te enviamos.' }, { status: 403 });
  if (!(await allow(`followup:ip:${clientIp(req)}`, 20, 3600))) return tooMany();
  const secret = process.env.ORDER_SECRET;

  if (typeof b.stop === 'boolean') {
    const { error } = await supabasePublic.rpc('followup_set_paused', { p_secret: secret, p_order: o, p_paused: b.stop });
    if (error) { console.error('followup_set_paused', error.message); return NextResponse.json({ error: 'No se pudo guardar.' }, { status: 500 }); }
    return NextResponse.json({ ok: true });
  }

  const body = String(b.body || '').trim().slice(0, 3000);
  if (body.length < 2) return NextResponse.json({ error: 'Escribe tu mensaje.' }, { status: 400 });
  const { data, error } = await supabasePublic.rpc('followup_reply', { p_secret: secret, p_order: o, p_body: body });
  if (error || data !== true) { if (error) console.error('followup_reply', error.message); return NextResponse.json({ error: 'No se pudo enviar. Inténtalo más tarde.' }, { status: 500 }); }

  // Aviso a la tienda
  const notify = process.env.ORDER_NOTIFY_EMAIL;
  if (notify) {
    const { data: th } = await supabasePublic.rpc('followup_thread', { p_secret: secret, p_order: o });
    const row = Array.isArray(th) ? th[0] : null;
    if (row) await sendEmail(notify, followupNewReplyShopEmail({ name: row.name || '', email: '', order_number: row.order_number, body })).catch(() => false);
  }
  return NextResponse.json({ ok: true });
}
