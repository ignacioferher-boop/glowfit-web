import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { allow } from '@/lib/ratelimit';
import { recordPaidSession } from '@/lib/stripeOrders';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Red de seguridad: busca en Stripe los pagos completados de los últimos 3 días y guarda los que falten
// (por si el aviso del webhook no llegó). Es idempotente: un pedido ya guardado no se duplica ni reenvía correos.
export async function GET(req: Request) {
  const cron = process.env.CRON_SECRET && req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
  if (!cron && !(await allow('stripe-reconcile', 6, 3600))) return NextResponse.json({ error: 'espera' }, { status: 429 });
  const key = (process.env.STRIPE_SECRET_KEY || '').trim();
  const orderSecret = process.env.ORDER_SECRET;
  if (!key || !orderSecret) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const stripe = new Stripe(key);
  const since = Math.floor(Date.now() / 1000) - 3 * 86400;
  const results: { order?: number; ok: boolean; error?: string }[] = [];
  for await (const s of stripe.checkout.sessions.list({ created: { gte: since }, status: 'complete', limit: 100 })) {
    if (s.payment_status !== 'paid' || s.metadata?.diagnostic === 'true') continue;
    const r = await recordPaidSession(stripe, s.id, orderSecret);
    results.push(r.ok ? { ok: true, order: r.order_number } : { ok: false, error: r.error });
  }
  const out: Record<string, unknown> = { revisados: results.length, pedidos: results };
  // Estado de los webhooks (sin secretos) para diagnosticar avisos que no llegan
  try {
    const wh = await stripe.webhookEndpoints.list({ limit: 10 });
    out.webhooks = wh.data.map((w) => ({ url: w.url, status: w.status, events: w.enabled_events }));
  } catch (e) { out.webhooks = `sin acceso (${(e as { code?: string }).code ?? 'error'})`; }
  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
