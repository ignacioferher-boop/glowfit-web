'use client';
import { useState } from 'react';
import { useCart } from '@/components/cart';
import { formatEUR, SHIPPING } from '@/lib/config';

export default function Carrito() {
  const { items, setQty, remove, subtotal } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accept, setAccept] = useState(false);
  const free = SHIPPING.freeFromCents > 0 && subtotal >= SHIPPING.freeFromCents;
  const shipping = items.length === 0 ? 0 : free ? 0 : SHIPPING.standardCents;

  async function checkout() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/checkout/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map((i) => ({ slug: i.slug, qty: i.qty })) }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'No se pudo iniciar el pago');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar el pago. Inténtalo de nuevo en unos segundos.');
      setLoading(false);
    }
  }

  if (items.length === 0)
    return (
      <section className="page-section narrow center">
        <h1 className="section-title">TU CARRITO</h1>
        <p>Tu carrito de la compra está vacío.</p>
        <a className="btn" href="/productos/">Volver a la tienda</a>
      </section>
    );

  return (
    <section className="page-section narrow">
      <h1 className="section-title">TU CARRITO</h1>
      <ul className="cart-list">
        {items.map((i) => (
          <li key={i.slug}>
            <img src={i.image} alt="" />
            <div className="cart-name"><a href={`/producto/${i.slug}/`}>{i.name}</a><span>{formatEUR(i.price_cents)}</span></div>
            <div className="cart-qty">
              <button onClick={() => setQty(i.slug, i.qty - 1)} aria-label={`Quitar una unidad de ${i.name}`}>−</button>
              <span aria-live="polite">{i.qty}</span>
              <button onClick={() => setQty(i.slug, i.qty + 1)} aria-label={`Añadir una unidad de ${i.name}`}>+</button>
            </div>
            <strong className="cart-line">{formatEUR(i.price_cents * i.qty)}</strong>
            <button className="cart-remove" onClick={() => remove(i.slug)} aria-label={`Eliminar ${i.name}`}>✕</button>
          </li>
        ))}
      </ul>
      <div className="cart-summary">
        <p><span>Subtotal</span><span>{formatEUR(subtotal)}</span></p>
        <p><span>Envío (España)</span><span>{shipping === 0 ? 'Gratis' : formatEUR(shipping)}</span></p>
        {!free && SHIPPING.freeFromCents > 0 && (
          <p className="hint">Te faltan {formatEUR(SHIPPING.freeFromCents - subtotal)} para el envío gratis.</p>
        )}
        <p className="total"><span>Total</span><span>{formatEUR(subtotal + shipping)}</span></p>
        <p className="tax-note">IVA incluido. Entrega en {SHIPPING.minDays}–{SHIPPING.maxDays} días laborables.</p>
        <label className="accept">
          <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
          <span>He leído y acepto las <a href="/condiciones-de-contratacion/">condiciones de contratación</a> y la <a href="/politica-de-privacidad/">política de privacidad</a>.</span>
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn full" disabled={!accept || loading} onClick={checkout}>
          {loading ? 'Abriendo pago seguro…' : 'Finalizar compra'}
        </button>
        <p className="secure">Pago seguro con tarjeta, Apple Pay, Google Pay o PayPal</p>
      </div>
    </section>
  );
}
