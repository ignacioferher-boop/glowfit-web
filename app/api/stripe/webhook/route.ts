import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/data';

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !whsec) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const stripe = new Stripe(secret);

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, req.headers.get('stripe-signature') || '', whsec);
  } catch {
    return NextResponse.json({ error: 'firma no válida' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const s = event.data.object as Stripe.Checkout.Session;
    const full = await stripe.checkout.sessions.retrieve(s.id, { expand: ['line_items'] });
    const shipping = full.collected_information?.shipping_details;
    const items = (full.line_items?.data || []).map((li) => ({
      name: li.description, qty: li.quantity, unit_cents: li.price?.unit_amount, total_cents: li.amount_total,
    }));
    const { error } = await supabaseAdmin().from('orders').upsert({
      stripe_session_id: full.id,
      status: full.payment_status === 'paid' ? 'paid' : full.payment_status,
      email: full.customer_details?.email,
      name: shipping?.name || full.customer_details?.name,
      phone: full.customer_details?.phone || full.metadata?.phone,
      shipping_address: shipping?.address ?? full.customer_details?.address ?? null,
      items,
      subtotal_cents: full.amount_subtotal ?? 0,
      shipping_cents: full.total_details?.amount_shipping ?? 0,
      total_cents: full.amount_total ?? 0,
    }, { onConflict: 'stripe_session_id' });
    if (error) {
      console.error('Error guardando pedido', error);
      return NextResponse.json({ error: 'db' }, { status: 500 }); // Stripe reintentará
    }
  }
  return NextResponse.json({ received: true });
}
