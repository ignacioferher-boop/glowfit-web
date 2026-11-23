'use client';
import { useState } from 'react';
import { useCart } from '@/components/cart';
import { formatEUR, SHIPPING } from '@/lib/config';

export default function Carrito() {
  const { items, setQty, remove, subtotal } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accept, setAccept] = useState(false);
  const [noMarketing, setNoMarketing] = useState(false);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const errors = {
    name: customer.name.trim().length < 2 ? 'Escribe tu nombre y apellidos' : '',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim()) ? '' : 'Escribe un email válido',
    phone: customer.phone.replace(/[^0-9]/g, '').length >= 9 ? '' : 'Escribe un teléfono válido (9 dígitos)',
  };
  const valid = !errors.name && !errors.email && !errors.phone && accept;
  const field = (k: 'name' | 'email' | 'phone') => ({
    value: customer[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCustomer({ ...customer, [k]: e.target.value }),
    onBlur: () => setTouched({ ...touched, [k]: true }),
    'aria-invalid': touched[k] && !!errors[k],
  });
  const free = SHIPPING.freeFromCents > 0 && subtotal >= SHIPPING.freeFromCents;
  const shipping = items.length === 0 ? 0 : free ? 0 : SHIPPING.standardCents;

  async function checkout() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/checkout/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
          customer: { ...customer, accepts_marketing: !noMarketing, accepted_terms: accept },
        }),
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
      </div>

      <form className="checkout-form" onSubmit={(e) => { e.preventDefault(); setTouched({ name: true, email: true, phone: true }); if (!accept) { setError('Para continuar, acepta las condiciones de contratación.'); return; } if (valid) checkout(); }} noValidate>
        <h2 className="section-title small">TUS DATOS</h2>
        <p className="form-note">Los necesitamos para tu pedido, enviarte el recibo y avisarte del envío.</p>
        <label>Nombre y apellidos<input autoComplete="name" required {...field('name')} />{touched.name && errors.name && <span className="field-error">{errors.name}</span>}</label>
        <div className="row">
          <label>Email<input type="email" autoComplete="email" required {...field('email')} />{touched.email && errors.email && <span className="field-error">{errors.email}</span>}</label>
          <label>Teléfono<input type="tel" autoComplete="tel" required {...field('phone')} />{touched.phone && errors.phone && <span className="field-error">{errors.phone}</span>}</label>
        </div>
        <label className="accept">
          <input type="checkbox" checked={accept} onChange={(e) => { setAccept(e.target.checked); setError(''); }} required />
          <span>He leído y acepto las <a href="/condiciones-de-contratacion/" target="_blank">condiciones de contratación</a> y la <a href="/politica-de-privacidad/" target="_blank">política de privacidad</a>, incluido el envío de comunicaciones sobre mi pedido y de novedades y promociones de Glowfit por email.</span>
        </label>
        <label className="accept optout">
          <input type="checkbox" checked={noMarketing} onChange={(e) => setNoMarketing(e.target.checked)} />
          <span>No deseo recibir novedades ni promociones por email.</span>
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn full" type="submit" disabled={loading}>
          {loading ? 'Abriendo pago seguro…' : 'Continuar al pago'}
        </button>
        <p className="secure">Pago seguro con tarjeta, Apple Pay, Google Pay o PayPal</p>
      </form>
    </section>
  );
}
