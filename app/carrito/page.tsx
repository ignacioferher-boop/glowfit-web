'use client';
import { emailSuggestion, normPhoneES, validEmailAddr, validFullName } from '@/lib/validate';
import { useState } from 'react';
import { useCart } from '@/components/cart';
import { formatEUR, SHIPPING, onlyTestProduct } from '@/lib/config';
import { useCurrency, CurrencyNote } from '@/components/currency';

export default function Carrito() {
  const { items, setQty, remove, subtotal } = useCart();
  const { format: money } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accept, setAccept] = useState(false);
  const [noMarketing, setNoMarketing] = useState(false);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const errors = {
    name: validFullName(customer.name) ? '' : 'Escribe tu nombre y al menos un apellido',
    email: validEmailAddr(customer.email) ? '' : 'Escribe un email válido',
    phone: normPhoneES(customer.phone) ? '' : 'Escribe un móvil o teléfono español válido (9 cifras)',
  };
  const valid = !errors.name && !errors.email && !errors.phone && accept;
  const field = (k: 'name' | 'email' | 'phone') => ({
    value: customer[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCustomer({ ...customer, [k]: e.target.value }),
    onBlur: () => setTouched({ ...touched, [k]: true }),
    'aria-invalid': touched[k] && !!errors[k],
  });
  const free = (SHIPPING.freeFromCents > 0 && subtotal >= SHIPPING.freeFromCents) || onlyTestProduct(items.map((i) => i.slug));
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
      if (Array.isArray(data.unavailable) && data.unavailable.length) {
        // Quita del carrito lo que ya no se vende, para que el cliente pueda seguir
        data.unavailable.forEach((slug: string) => remove(slug));
        throw new Error('Hemos quitado de tu carrito un producto que ya no está disponible. Revisa el total y vuelve a pulsar «Continuar al pago».');
      }
      if (!res.ok || !data.url) throw new Error(data.error || 'No se pudo iniciar el pago');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar el pago. Inténtalo de nuevo en unos segundos.');
      setLoading(false);
    }
  }

  if (items.length === 0)
    return (
      <section className="page-section narrow center cart-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6" /><circle cx="9.5" cy="20" r="1.3" /><circle cx="17" cy="20" r="1.3" /></svg>
        <h1 className="section-title">TU CARRITO</h1>
        <p className="script mid-script">Todavía está vacío</p>
        <p>Descubre nuestras fórmulas y empieza tu rutina Glowfit.</p>
        <a className="btn" href="/productos/">Ver productos</a>
      </section>
    );

  return (
    <section className="page-section cart-page">
      <h1 className="section-title">TU CARRITO</h1>
      <ol className="steps" aria-label="Pasos de la compra">
        <li className="on">Carrito</li><li className="on">Tus datos</li><li>Pago seguro</li>
      </ol>
      <div className="cart-layout">
      <div className="cart-main">
      {SHIPPING.freeFromCents > 0 && (
        <div className="ship-progress">
          <p>{free ? <><strong>¡Tienes envío gratis!</strong></> : <>Te faltan <strong>{money(SHIPPING.freeFromCents - subtotal)}</strong> para el envío gratis</>}</p>
          <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round((subtotal / SHIPPING.freeFromCents) * 100))} aria-label="Progreso hacia el envío gratis"><span style={{ width: `${Math.min(100, (subtotal / SHIPPING.freeFromCents) * 100)}%` }} /></div>
        </div>
      )}
      <ul className="cart-list">
        {items.map((i) => (
          <li key={i.slug}>
            <img src={i.image} alt="" />
            <div className="cart-name"><a href={`/producto/${i.slug}/`}>{i.name}</a><span>{money(i.price_cents)}</span></div>
            <div className="cart-qty">
              <button onClick={() => setQty(i.slug, i.qty - 1)} aria-label={`Quitar una unidad de ${i.name}`}>−</button>
              <span aria-live="polite">{i.qty}</span>
              <button onClick={() => setQty(i.slug, i.qty + 1)} aria-label={`Añadir una unidad de ${i.name}`}>+</button>
            </div>
            <strong className="cart-line">{money(i.price_cents * i.qty)}</strong>
            <button className="cart-remove" onClick={() => remove(i.slug)} aria-label={`Eliminar ${i.name}`}>✕</button>
          </li>
        ))}
      </ul>
      <a className="keep-shopping" href="/productos/">← Seguir comprando</a>
      </div>
      <aside className="cart-side">
      <div className="cart-summary">
        <h2 className="kiona summary-title">RESUMEN</h2>
        <p><span>Subtotal</span><span>{money(subtotal)}</span></p>
        <p><span>Envío (España)</span><span>{shipping === 0 ? 'Gratis' : money(shipping)}</span></p>
        <p className="total"><span>Total</span><span>{money(subtotal + shipping)}</span></p>
        <CurrencyNote eurCents={subtotal + shipping} />
        <p className="tax-note">IVA incluido. Entrega en {SHIPPING.minDays}–{SHIPPING.maxDays} días laborables.</p>
      </div>

      <form className="checkout-form" onSubmit={(e) => { e.preventDefault(); setTouched({ name: true, email: true, phone: true }); if (!accept) { setError('Para continuar, acepta las condiciones de contratación.'); return; } if (valid) checkout(); }} noValidate>
        <h2 className="section-title small">TUS DATOS</h2>
        <p className="form-note">Los necesitamos para tu pedido, enviarte el recibo y avisarte del envío.</p>
        <label>Nombre y apellidos<input autoComplete="name" required {...field('name')} />{touched.name && errors.name && <span className="field-error">{errors.name}</span>}</label>
        <div className="row">
          <label>Email<input type="email" autoComplete="email" required {...field('email')} />{touched.email && errors.email && <span className="field-error">{errors.email}</span>}{!errors.email && emailSuggestion(customer.email) && <button type="button" className="field-hint" onClick={() => setCustomer({ ...customer, email: emailSuggestion(customer.email)! })}>¿Quisiste decir <strong>{emailSuggestion(customer.email)}</strong>?</button>}</label>
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
        <p className="secure"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" /></svg> Pago seguro con tarjeta, Apple Pay, Google Pay o PayPal</p>
      </form>
      </aside>
      </div>
    </section>
  );
}
