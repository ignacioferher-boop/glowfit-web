import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { allow } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

// Diagnóstico TEMPORAL: comprueba que la clave de Stripe tiene los permisos que usa la web.
// Crea una sesión de pago de 1 € (no cobra nada) y la caduca al momento. Solo devuelve ok/error.
export async function GET() {
  if (!(await allow('health-stripe', 3, 3600))) return NextResponse.json({ error: 'espera' }, { status: 429 });
  const key = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (!key) return NextResponse.json({ error: 'falta clave' });
  const stripe = new Stripe(key);
  const out: Record<string, unknown> = {};
  const step = async (name: string, fn: () => Promise<unknown>) => {
    try { out[name] = (await fn()) ?? 'ok'; } catch (e) { const err = e as { type?: string; code?: string; statusCode?: number }; out[name] = `ERROR ${err.statusCode ?? ''} ${err.type ?? ''} ${err.code ?? ''}`.trim(); }
  };
  let id = '';
  await step('crear_sesion', async () => {
    const s = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: 100, product_data: { name: 'Prueba de conexión (no se cobra)' } } }],
      success_url: 'https://glowfit.group/', cancel_url: 'https://glowfit.group/',
      tax_id_collection: { enabled: true }, customer_creation: 'always', allow_promotion_codes: true,
      invoice_creation: { enabled: true }, phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: ['ES'] },
      after_expiration: { recovery: { enabled: true, allow_promotion_codes: true } },
      metadata: { diagnostic: 'true', accepts_marketing: 'false' },
    });
    id = s.id;
    return { livemode: s.livemode };
  });
  if (id) {
    await step('leer_sesion', async () => { await stripe.checkout.sessions.retrieve(id, { expand: ['line_items', 'invoice'] }); });
    await step('leer_lineas', async () => { await stripe.checkout.sessions.listLineItems(id, { limit: 1 }); });
    await step('caducar_sesion', async () => { await stripe.checkout.sessions.expire(id); });
  }
  await step('codigos_descuento', async () => { await stripe.promotionCodes.list({ limit: 1 }); });
  await step('cupones', async () => { await stripe.coupons.list({ limit: 1 }); });
  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
