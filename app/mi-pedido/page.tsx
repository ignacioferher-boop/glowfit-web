'use client';
import { useState } from 'react';
import { supabasePublic } from '@/lib/data';
import { media } from '@/lib/config';
import { Price } from '@/components/currency';

type Found = { order_number: number; created_at: string; fulfillment: string; tracking: string | null; items: { name: string; qty: number; total_cents: number }[] | null; shipping_cents: number; total_cents: number; city: string | null };
const STEPS = [
  { v: 'nuevo', l: 'Recibido', d: 'Hemos recibido tu pedido y tu pago.' },
  { v: 'preparando', l: 'Preparando', d: 'Estamos preparando tu paquete con mimo.' },
  { v: 'enviado', l: 'Enviado', d: 'Tu pedido va de camino.' },
  { v: 'entregado', l: 'Entregado', d: '¡Disfruta de tu rutina Glowfit!' },
];

export default function MiPedido() {
  const [num, setNum] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Found | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault(); setError('');
    const n = Number(num.replace(/[^0-9]/g, ''));
    if (!n || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Escribe tu número de pedido y el email con el que compraste.'); return; }
    setBusy(true);
    const { data, error: err } = await supabasePublic!.rpc('lookup_order', { p_number: n, p_email: email.trim() });
    setBusy(false);
    const row = Array.isArray(data) ? data[0] : null;
    if (err || !row) { setError('No encontramos ningún pedido con esos datos. Revisa el número (lo tienes en el email de confirmación) y el email.'); return; }
    setOrder(row as Found);
  }

  const idx = order ? STEPS.findIndex((s) => s.v === order.fulfillment) : -1;
  const cancelled = order?.fulfillment === 'cancelado';

  return (
    <>
      <header className="shop-hero" style={{ backgroundImage: `url(${media('2026/05/FONDO-COLOR-scaled.png')})` }}>
        <p className="kiona legal-eyebrow">TU CUENTA</p>
        <h1 className="section-title">MI PEDIDO</h1>
        <img className="brillo center" src={media('2026/05/BRILLO-LINEA.png')} alt="" />
        <p className="shop-sub">Consulta en qué punto está tu pedido.</p>
      </header>
      <section className="page-section track-page">
        {!order ? (
          <form className="track-card" onSubmit={search} noValidate>
            <label>Número de pedido<input inputMode="numeric" placeholder="Ej. 1001" value={num} onChange={(e) => setNum(e.target.value)} autoComplete="off" /></label>
            <label>Email de la compra<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            {error && <p className="error" role="alert">{error}</p>}
            <button className="btn full" disabled={busy}>{busy ? 'Buscando…' : 'Ver mi pedido'}</button>
            <p className="form-note">Encontrarás el número de pedido en el email de confirmación que te enviamos al comprar.</p>
          </form>
        ) : (
          <div className="track-card track-result">
            <div className="track-head">
              <div><p className="kiona card-cat">PEDIDO</p><h2>#{order.order_number}</h2></div>
              <p className="tax-note">{new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            {cancelled ? <p className="currency-note">Este pedido está cancelado. Si tienes dudas, escríbenos desde la página de contacto.</p> : (
              <ol className="track-steps">
                {STEPS.map((s, i) => (
                  <li key={s.v} className={`${i <= idx ? 'done' : ''}${i === idx ? ' now' : ''}`} style={{ animationDelay: `${i * 120}ms` }}>
                    <span className="dot">{i < idx ? '✓' : i + 1}</span>
                    <div><strong>{s.l}</strong>{i === idx && <p>{s.d}{s.v === 'enviado' && order.tracking && <> Nº de seguimiento: <b>{order.tracking}</b></>}</p>}</div>
                  </li>
                ))}
              </ol>
            )}
            <ul className="track-items">
              {(order.items ?? []).map((i, n) => <li key={n}><span>{i.qty} × {i.name}</span><Price cents={i.total_cents} /></li>)}
              <li className="muted"><span>Envío{order.city ? ` a ${order.city}` : ''}</span>{order.shipping_cents ? <Price cents={order.shipping_cents} /> : <span>Gratis</span>}</li>
              <li className="total"><span>Total</span><Price cents={order.total_cents} /></li>
            </ul>
            <button className="link-btn" onClick={() => { setOrder(null); setNum(''); }}>Consultar otro pedido</button>
          </div>
        )}
      </section>
    </>
  );
}
