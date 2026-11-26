import Stripe from 'stripe';
import ClearCart from './ClearCart';
import { recordPaidSession } from '@/lib/stripeOrders';

export const metadata = { title: 'Pedido confirmado', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Además del webhook, guarda el pedido en cuanto el cliente vuelve de pagar (idempotente: nunca duplica ni reenvía correos).
async function ensureOrder(sessionId?: string) {
  const key = (process.env.STRIPE_SECRET_KEY || '').trim();
  const orderSecret = process.env.ORDER_SECRET;
  if (!sessionId || !/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId) || !key || !orderSecret) return;
  try {
    const stripe = new Stripe(key);
    const s = await stripe.checkout.sessions.retrieve(sessionId);
    if (s.status === 'complete' && s.payment_status === 'paid') await recordPaidSession(stripe, s.id, orderSecret);
  } catch (e) { console.error('exito: no se pudo comprobar la sesión', (e as Error)?.message); }
}

export default async function Exito({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  await ensureOrder(session_id);
  return (
    <section className="page-section narrow center">
      <ClearCart />
      <p className="script big-script">¡Gracias!</p>
      <h1 className="section-title">TU PEDIDO ESTÁ CONFIRMADO</h1>
      <p>Te hemos enviado un email con el recibo de tu compra. En cuanto lo enviemos te avisaremos.</p>
      <a className="btn" href="/">Volver al inicio</a>
    </section>
  );
}
