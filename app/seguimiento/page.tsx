import type { Metadata } from 'next';
import { supabasePublic } from '@/lib/data';
import { validFollowupToken } from '@/lib/followup';
import FollowupChat, { type Msg } from './FollowupChat';

export const metadata: Metadata = { title: 'Tu seguimiento', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function Seguimiento({ searchParams }: { searchParams: Promise<{ o?: string; t?: string; baja?: string }> }) {
  const { o = '', t = '', baja } = await searchParams;
  let info: { order_number: number; name: string; paused: boolean; messages: Msg[] } | null = null;
  if (validFollowupToken(o, t) && supabasePublic) {
    const { data } = await supabasePublic.rpc('followup_thread', { p_secret: process.env.ORDER_SECRET, p_order: o });
    info = Array.isArray(data) ? data[0] ?? null : null;
  }
  return (
    <section className="page-section review-page">
      <p className="kiona legal-eyebrow center">TU SEGUIMIENTO</p>
      {!info ? <>
        <h1 className="section-title">Enlace no válido</h1>
        <p className="center">Usa el enlace del email que te enviamos. Si tienes cualquier problema, escríbenos a través de <a href="/sobre-nosotros/">contacto</a>.</p>
      </> : <>
        <h1 className="section-title">Hola{info.name ? `, ${info.name.split(' ')[0]}` : ''}</h1>
        <p className="center">Aquí tienes nuestra conversación sobre tu pedido #{info.order_number}. Te leemos y te contestamos personalmente.</p>
        <FollowupChat o={o} t={t} initial={info.messages} paused={info.paused} askStop={baja === '1'} />
      </>}
    </section>
  );
}
