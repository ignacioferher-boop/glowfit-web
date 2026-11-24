'use client';
import { useEffect, useRef, useState } from 'react';
import { media } from '@/lib/config';
import { Price } from '@/components/currency';

type Item = { name: string; qty: number; total_cents: number };
type Order = { order_number: number; created_at: string; fulfillment: string; tracking: string | null; items: Item[] | null; subtotal_cents: number; shipping_cents: number; total_cents: number; shipping_address: Record<string, string | null> | null; name: string | null };
const STEPS = [
  { v: 'nuevo', l: 'Recibido', d: 'Hemos recibido tu pedido y tu pago.' },
  { v: 'preparando', l: 'Preparando', d: 'Estamos preparando tu paquete con mimo.' },
  { v: 'enviado', l: 'Enviado', d: 'Tu pedido va de camino.' },
  { v: 'entregado', l: 'Entregado', d: '¡Disfruta de tu rutina Glowfit!' },
];
const LABEL: Record<string, string> = { nuevo: 'Recibido', preparando: 'Preparando', enviado: 'Enviado', entregado: 'Entregado', cancelado: 'Cancelado' };
const fecha = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

export default function MiCuenta() {
  const [state, setState] = useState<'loading' | 'out' | 'in'>('loading');
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadError, setLoadError] = useState('');

  async function load() {
    try {
      const r = await fetch('/api/account/me/', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) { setLoadError(j.error || 'No hemos podido cargar tus pedidos.'); setState('in'); return; }
      if (!j.email) { setState('out'); return; }
      setEmail(j.email); setOrders(j.orders ?? []); setState('in');
    } catch { setState('out'); }
  }
  useEffect(() => { load(); }, []);

  async function logout() {
    await fetch('/api/account/logout/', { method: 'POST' });
    setOrders([]); setEmail(''); setState('out');
  }

  const name = orders.find((o) => o.name)?.name?.split(' ')[0];
  return (
    <>
      <header className="shop-hero" style={{ backgroundImage: `url(${media('2026/05/FONDO-COLOR-scaled.png')})` }}>
        <p className="kiona legal-eyebrow">TU CUENTA</p>
        <h1 className="section-title">{state === 'in' ? (name ? `HOLA, ${name.toUpperCase()}` : 'MI CUENTA') : 'MI CUENTA'}</h1>
        <img className="brillo center" src={media('2026/05/BRILLO-LINEA.png')} alt="" />
        <p className="shop-sub">{state === 'in' ? 'Aquí tienes tus pedidos y su estado.' : 'Entra con tu email para ver tus pedidos y tu historial de compras.'}</p>
      </header>
      <section className="page-section track-page">
        {state === 'loading' && <div className="track-card acc-loading" aria-busy="true"><span className="acc-spinner" aria-label="Cargando" /></div>}
        {state === 'out' && <Login onDone={load} />}
        {state === 'in' && <Dashboard email={email} orders={orders} error={loadError} onLogout={logout} />}
      </section>
    </>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const codeRef = useRef<HTMLInputElement>(null);

  async function request(e?: React.FormEvent) {
    e?.preventDefault(); setError(''); setInfo('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Escribe el email con el que compraste.'); return; }
    setBusy(true);
    const r = await fetch('/api/account/request/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r || !r.ok) { setError(j.error || 'No hemos podido enviarte el código. Inténtalo de nuevo.'); return; }
    setStep('code'); setCode(''); setInfo(`Te hemos enviado un código de 6 cifras a ${email.trim()}.`);
    setTimeout(() => codeRef.current?.focus(), 50);
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (code.replace(/[^0-9]/g, '').length !== 6) { setError('El código tiene 6 cifras.'); return; }
    setBusy(true);
    const r = await fetch('/api/account/verify/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r || !r.ok) { setError(j.error || 'El código no es correcto.'); return; }
    onDone();
  }

  return step === 'email' ? (
    <form className="track-card" onSubmit={request} noValidate>
      <h2 className="acc-title">Entrar en mi cuenta</h2>
      <p className="form-note acc-lead">Sin contraseñas: te enviamos un código al email con el que compraste.</p>
      <label>Email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn full" disabled={busy}>{busy ? 'Enviando…' : 'Enviarme el código'}</button>
      <p className="form-note">¿Solo quieres consultar un pedido? <a href="/mi-pedido/">Búscalo con tu número de pedido</a>.</p>
    </form>
  ) : (
    <form className="track-card" onSubmit={verify} noValidate>
      <h2 className="acc-title">Revisa tu email</h2>
      {info && <p className="form-note acc-lead">{info} Caduca en 10 minutos (mira también en spam).</p>}
      <label>Código de acceso<input ref={codeRef} className="acc-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="······" value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn full" disabled={busy}>{busy ? 'Comprobando…' : 'Entrar'}</button>
      <p className="form-note"><button type="button" className="link-btn" onClick={() => request()} disabled={busy}>Reenviar código</button> · <button type="button" className="link-btn" onClick={() => { setStep('email'); setError(''); }}>Cambiar email</button></p>
    </form>
  );
}

function Dashboard({ email, orders, error, onLogout }: { email: string; orders: Order[]; error: string; onLogout: () => void }) {
  const active = orders.filter((o) => o.fulfillment !== 'entregado' && o.fulfillment !== 'cancelado');
  const past = orders.filter((o) => !active.includes(o));
  return (
    <div className="acc-wrap">
      <div className="track-card acc-profile">
        <div><p className="kiona card-cat">CONECTADA COMO</p><strong className="acc-email">{email}</strong></div>
        <div className="acc-stats">
          <span><b>{orders.length}</b> {orders.length === 1 ? 'pedido' : 'pedidos'}</span>
          <span><b>{active.length}</b> en curso</span>
        </div>
        <button className="link-btn" onClick={onLogout}>Cerrar sesión</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {!error && orders.length === 0 && (
        <div className="track-card acc-empty">
          <h2 className="acc-title">Aún no tienes pedidos</h2>
          <p className="form-note">Cuando compres con <b>{email}</b>, tus pedidos aparecerán aquí automáticamente.</p>
          <a className="btn" href="/productos/">Ver productos</a>
        </div>
      )}
      {active.length > 0 && <><h2 className="acc-h">Pedidos en curso</h2>{active.map((o, i) => <OrderCard key={o.order_number} o={o} open i={i} />)}</>}
      {past.length > 0 && <><h2 className="acc-h">Historial de compras</h2>{past.map((o, i) => <OrderCard key={o.order_number} o={o} open={false} i={i} />)}</>}
    </div>
  );
}

function OrderCard({ o, open: initial, i }: { o: Order; open: boolean; i: number }) {
  const [open, setOpen] = useState(initial);
  const idx = STEPS.findIndex((s) => s.v === o.fulfillment);
  const cancelled = o.fulfillment === 'cancelado';
  const a = o.shipping_address;
  const units = (o.items ?? []).reduce((n, x) => n + x.qty, 0);
  return (
    <article className={`track-card acc-order${open ? ' open' : ''}`} style={{ animationDelay: `${i * 60}ms` }}>
      <button className="acc-order-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div><strong>Pedido #{o.order_number}</strong><small>{fecha(o.created_at)} · {units} {units === 1 ? 'producto' : 'productos'}</small></div>
        <span className={`acc-badge s-${o.fulfillment}`}>{LABEL[o.fulfillment] ?? o.fulfillment}</span>
        <span className="acc-total"><Price cents={o.total_cents} /></span>
        <span className="acc-chev" aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="acc-order-body">
          {cancelled ? <p className="currency-note">Este pedido está cancelado. Si tienes dudas, escríbenos desde la página de contacto.</p> : (
            <ol className="track-steps">
              {STEPS.map((s, n) => (
                <li key={s.v} className={`${n <= idx ? 'done' : ''}${n === idx ? ' now' : ''}`}>
                  <span className="dot">{n < idx ? '✓' : n + 1}</span>
                  <div><strong>{s.l}</strong>{n === idx && <p>{s.d}{s.v === 'enviado' && o.tracking && <> Nº de seguimiento: <b>{o.tracking}</b></>}</p>}</div>
                </li>
              ))}
            </ol>
          )}
          <ul className="track-items">
            {(o.items ?? []).map((x, n) => <li key={n}><span>{x.qty} × {x.name}</span><Price cents={x.total_cents} /></li>)}
            <li className="muted"><span>Envío</span>{o.shipping_cents ? <Price cents={o.shipping_cents} /> : <span>Gratis</span>}</li>
            <li className="total"><span>Total</span><Price cents={o.total_cents} /></li>
          </ul>
          {a && <p className="form-note acc-addr"><b>Enviado a:</b> {[o.name, a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(' '), a.state].filter(Boolean).join(', ')}</p>}
          <p className="form-note">¿Algún problema con este pedido? <a href="/sobre-nosotros/">Escríbenos</a> indicando el nº #{o.order_number}.</p>
        </div>
      )}
    </article>
  );
}
