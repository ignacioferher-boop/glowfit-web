import type { Metadata } from 'next';
import { supabasePublic } from '@/lib/data';
import { validReviewToken } from '@/lib/reviews';
import ReviewForm from './ReviewForm';

export const metadata: Metadata = { title: 'Tu opinión', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function Opinar({ searchParams }: { searchParams: Promise<{ o?: string; t?: string; r?: string }> }) {
  const { o = '', t = '', r } = await searchParams;
  let state: 'invalid' | 'done' | 'ok' = 'invalid';
  let info: { order_number: number; name: string; items: { name: string; qty: number }[] } | null = null;
  if (/^[0-9a-f-]{36}$/i.test(o) && validReviewToken(o, t)) {
    const { data } = await supabasePublic!.rpc('review_order_info', { p_secret: process.env.ORDER_SECRET, p_order: o });
    const row = Array.isArray(data) ? data[0] : null;
    if (row) { info = row; state = row.reviewed ? 'done' : 'ok'; }
  }
  return (
    <section className="page-section review-page">
      <p className="kiona legal-eyebrow center">TU OPINIÓN</p>
      {state === 'invalid' && <><h1 className="section-title">Enlace no válido</h1><p className="center">Usa el enlace del email que te enviamos. Si tienes cualquier problema, escríbenos a través de <a href="/sobre-nosotros/">contacto</a>.</p></>}
      {state === 'done' && <><h1 className="section-title">¡Gracias!</h1><p className="center">Ya recibimos tu opinión sobre el pedido #{info?.order_number}.</p></>}
      {state === 'ok' && info && <>
        <h1 className="section-title">¿Qué tal tu pedido #{info.order_number}?</h1>
        <p className="center review-items">{info.items.map((i) => `${i.qty}× ${i.name}`).join(' · ')}</p>
        <ReviewForm o={o} t={t} initial={Number(r) || 0} name={(info.name || '').split(' ')[0]} />
      </>}
    </section>
  );
}
