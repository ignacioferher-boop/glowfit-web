import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getProducts } from '@/lib/data';
import { SHIPPING } from '@/lib/config';

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'El pago aún no está activado. Escríbenos por WhatsApp para completar tu pedido.' }, { status: 503 });
  const stripe = new Stripe(secret);

  let body: { items?: { slug: string; qty: number }[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Petición no válida' }, { status: 400 }); }
  const requested = (body.items || []).filter((i) => typeof i.slug === 'string' && Number.isInteger(i.qty) && i.qty > 0 && i.qty <= 20);
  if (!requested.length) return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });

  // Precios siempre desde la base de datos, nunca desde el navegador
  const catalog = await getProducts();
  const lines = requested.flatMap((r) => {
    const p = catalog.find((c) => c.slug === r.slug);
    return p ? [{ p, qty: r.qty }] : [];
  });
  if (!lines.length) return NextResponse.json({ error: 'Los productos ya no están disponibles' }, { status: 400 });

  const subtotal = lines.reduce((n, l) => n + l.p.price_cents * l.qty, 0);
  const free = SHIPPING.freeFromCents > 0 && subtotal >= SHIPPING.freeFromCents;
  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    locale: 'es',
    line_items: lines.map(({ p, qty }) => ({
      quantity: qty,
      price_data: {
        currency: 'eur',
        unit_amount: p.price_cents,
        product_data: { name: p.name, images: p.images.slice(0, 1), metadata: { slug: p.slug } },
      },
    })),
    shipping_address_collection: { allowed_countries: ['ES'] },
    phone_number_collection: { enabled: true },
    shipping_options: [{
      shipping_rate_data: {
        type: 'fixed_amount',
        display_name: free ? 'Envío gratis' : 'Envío estándar',
        fixed_amount: { amount: free ? 0 : SHIPPING.standardCents, currency: 'eur' },
        delivery_estimate: { minimum: { unit: 'business_day', value: SHIPPING.minDays }, maximum: { unit: 'business_day', value: SHIPPING.maxDays } },
      },
    }],
    metadata: { items: JSON.stringify(lines.map(({ p, qty }) => ({ slug: p.slug, qty }))) },
    success_url: `${site}/checkout/exito/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/carrito/`,
  });

  return NextResponse.json({ url: session.url });
}
