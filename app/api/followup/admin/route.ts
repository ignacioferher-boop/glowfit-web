import { NextResponse } from 'next/server';
import { adminFromRequest } from '@/lib/admin-auth';
import { followupUrl } from '@/lib/followup';
import { followupReplyToCustomerEmail, sendEmail } from '@/lib/email';

// El equipo contesta a un cliente desde el panel: se guarda en la conversación y se le envía por email.
export async function POST(req: Request) {
  const db = await adminFromRequest(req);
  if (!db) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const id = String(b.id || '');
  const body = String(b.body || '').trim().slice(0, 5000);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Pedido no válido.' }, { status: 400 });
  if (body.length < 2) return NextResponse.json({ error: 'Escribe tu respuesta.' }, { status: 400 });

  const { data: list, error: lErr } = await db.rpc('admin_followups');
  const order = ((list ?? []) as { id: string; name: string; email: string }[]).find((x) => x.id === id);
  if (lErr || !order) return NextResponse.json({ error: 'No encontramos el pedido.' }, { status: 404 });

  const emailed = order.email ? await sendEmail(order.email, followupReplyToCustomerEmail({ name: order.name || '', reply: body, url: followupUrl(id) }), process.env.ORDER_NOTIFY_EMAIL) : false;
  const { error } = await db.from('followup_messages').insert({ order_id: id, author: 'glowfit', body, emailed, read_at: new Date().toISOString() });
  if (error) { console.error('followup admin insert', error.message); return NextResponse.json({ error: 'Se envió el email pero no se pudo guardar en el panel.' }, { status: 500 }); }
  await db.rpc('admin_followup_mark_read', { p_order: id });
  return NextResponse.json({ ok: true, emailed });
}
