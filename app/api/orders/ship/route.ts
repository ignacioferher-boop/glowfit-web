import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, shippedEmail } from '@/lib/email';

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vwyvmqsxiazcrhjdiucm.supabase.co';
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_zSxDEjhUgDLaLDBJDVFvXg_rYGeW7Qi';

// Marca un pedido como enviado (con transportista y nº de seguimiento obligatorios) y avisa al cliente por email.
// Solo administradores: se usa la sesión del panel, así la base de datos aplica sus permisos.
export async function POST(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const db = createClient(URL_, KEY, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: admin } = await db.rpc('is_admin');
  if (admin !== true) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const id = String(b.id || '');
  const carrier = String(b.carrier || '').trim().slice(0, 60);
  const tracking = String(b.tracking || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  const resend = b.resend === true;
  if (!id || !carrier) return NextResponse.json({ error: 'Elige el transportista.' }, { status: 400 });
  if (tracking.length < 5) return NextResponse.json({ error: 'Escribe el número de seguimiento completo.' }, { status: 400 });

  const { data: order, error: getErr } = await db.from('orders').select('id,order_number,name,email,items,shipping_address,status,fulfillment,shipped_email_at').eq('id', id).single();
  if (getErr || !order) return NextResponse.json({ error: 'No encontramos el pedido.' }, { status: 404 });
  if (order.status !== 'paid') return NextResponse.json({ error: 'Este pedido no está pagado. Revísalo en Stripe antes de enviarlo.' }, { status: 409 });
  if (order.fulfillment === 'cancelado') return NextResponse.json({ error: 'El pedido está cancelado.' }, { status: 409 });

  const { error: upErr } = await db.from('orders').update({ fulfillment: order.fulfillment === 'entregado' ? 'entregado' : 'enviado', carrier, tracking }).eq('id', id);
  if (upErr) { console.error('ship update', upErr.message); return NextResponse.json({ error: 'No se pudo guardar. Inténtalo otra vez.' }, { status: 500 }); }

  let emailed = false;
  if (order.email && (!order.shipped_email_at || resend)) {
    emailed = await sendEmail(order.email, shippedEmail({ order_number: order.order_number, name: order.name || '', carrier, tracking, items: order.items ?? [], address: order.shipping_address }), process.env.ORDER_NOTIFY_EMAIL);
    if (emailed) await db.rpc('mark_shipped_emailed', { p_order: id });
  }
  return NextResponse.json({ ok: true, emailed, already: !!order.shipped_email_at && !resend });
}
