import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import Stripe from 'stripe';
import { supabasePublic } from '@/lib/data';
import { abandonedEmail, customerEmail, lowStockEmail, sendEmail, shopEmail } from '@/lib/email';
import { allow } from '@/lib/ratelimit';
import { recordPaidSession } from '@/lib/stripeOrders';
import { getInventorySettings } from '@/lib/settings';

export async function POST(req: Request) {
  const secret = (process.env.STRIPE_SECRET_KEY || '').trim();
  const whsec = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  const orderSecret = process.env.ORDER_SECRET;
  if (!secret || !whsec || !orderSecret || !supabasePublic) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const stripe = new Stripe(secret);

  const raw = await req.text();
  const sig = req.headers.get('stripe-signature') || '';
  let event: Stripe.Event;
  let isThin = false;
  try { isThin = JSON.parse(raw)?.object === 'v2.core.event'; } catch {}
  try {
    if (isThin) {
      // Destinos con carga "Breve" (thin events): tipo "v1.checkout.session.*" y solo el id de la sesión.
      // Se verifica la firma igual y se pide la sesión completa a Stripe.
      const n = stripe.parseEventNotification(raw, sig, whsec) as unknown as { type: string; related_object?: { id?: string } };
      const type = n.type.replace(/^v1\./, '');
      const id = n.related_object?.id;
      if (!type.startsWith('checkout.session.') || !id) return NextResponse.json({ received: true });
      const session = await stripe.checkout.sessions.retrieve(id);
      event = { type, data: { object: session } } as unknown as Stripe.Event;
    } else {
      event = stripe.webhooks.constructEvent(raw, sig, whsec);
    }
  } catch (e) {
    console.error('webhook: firma o evento no válido', (e as Error)?.message);
    return NextResponse.json({ error: 'firma no válida' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const s = event.data.object as Stripe.Checkout.Session;
    const r = await recordPaidSession(stripe, s.id, orderSecret);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 }); // Stripe reintentará
  }
  // El cliente no pagó a tiempo: libera los botes reservados
  if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
    const s = event.data.object as Stripe.Checkout.Session;
    await supabasePublic.rpc('attach_reservation', { p_secret: orderSecret, p_reservation: s.metadata?.reservation || null, p_session: s.id, p_release: true });
    revalidatePath('/', 'layout');
    // Carrito abandonado: un único recordatorio, solo si aceptó comunicaciones y Stripe guardó el enlace para retomarlo
    const url = s.after_expiration?.recovery?.url;
    const email = s.customer_details?.email || s.customer_email;
    if (event.type === 'checkout.session.expired' && url && email && s.metadata?.accepts_marketing === 'true' && (await allow(`recover:${email.toLowerCase()}`, 1, 7 * 86400))) {
      let items: { name: string; qty: number }[] = [];
      try { const li = await stripe.checkout.sessions.listLineItems(s.id, { limit: 20 }); items = li.data.map((l) => ({ name: l.description ?? '', qty: l.quantity ?? 1 })); } catch {}
      await sendEmail(email, abandonedEmail({ name: s.metadata?.name || '', url, items }), process.env.ORDER_NOTIFY_EMAIL);
    }
  }
  return NextResponse.json({ received: true });
}
