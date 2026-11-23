'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { sb } from '@/lib/supabase-browser';

const eur = (c: number | null | undefined) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format((c ?? 0) / 100);
const when = (d: string) => new Date(d).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
const FULFILL = [
  { v: 'nuevo', l: 'Nuevo' }, { v: 'preparando', l: 'Preparando' }, { v: 'enviado', l: 'Enviado' },
  { v: 'entregado', l: 'Entregado' }, { v: 'cancelado', l: 'Cancelado' },
];

type Order = {
  id: string; order_number: number | null; created_at: string; status: string; fulfillment: string; email: string; name: string; phone: string | null;
  shipping_address: Record<string, string> | null; items: { name: string; qty: number; unit_cents: number; total_cents: number }[];
  subtotal_cents: number; shipping_cents: number; total_cents: number; tracking: string | null; notes: string | null; accepts_marketing: boolean | null; email_sent_at: string | null;
};
type Product = {
  id?: string; slug: string; name: string; category: string | null; tagline: string | null; short_description: string | null; description: string | null;
  price_cents: number; images: string[]; active: boolean; sort: number;
};
type Customer = { id: string; created_at: string; name: string; email: string; phone: string; accepts_marketing: boolean };

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    sb().auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = sb().auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    sb().rpc('is_admin').then(({ data }) => setIsAdmin(data === true));
  }, [session]);

  if (!ready) return <section className="admin admin-center"><p>Cargando…</p></section>;
  if (!session) return <Login />;
  if (isAdmin === null) return <section className="admin admin-center"><p>Comprobando acceso…</p></section>;
  if (!isAdmin) return (
    <section className="admin admin-center">
      <div className="admin-card narrow">
        <h1 className="section-title small">SIN ACCESO</h1>
        <p>El email <strong>{session.user.email}</strong> no tiene permiso para entrar en el panel. Pide que lo añadan a la lista de administradores.</p>
        <button className="btn btn-small" onClick={() => sb().auth.signOut()}>Salir</button>
      </div>
    </section>
  );
  return <Panel email={session.user.email ?? ''} />;
}

function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    if (mode === 'up') {
      if (password.length < 8) { setMsg('La contraseña debe tener al menos 8 caracteres.'); setBusy(false); return; }
      const { error } = await sb().auth.signUp({ email, password });
      if (error) { setMsg(error.message.includes('registered') ? 'Ese email ya tiene acceso. Entra con tu contraseña.' : 'No se pudo crear el acceso. Revisa el email.'); setBusy(false); return; }
    }
    const { error } = await sb().auth.signInWithPassword({ email, password });
    if (error) setMsg(mode === 'up' ? 'Acceso creado. Si tu email está autorizado, ya puedes entrar con tu contraseña.' : 'Email o contraseña incorrectos.');
    setBusy(false);
  }
  return (
    <section className="admin admin-center">
      <form className="admin-card narrow admin-login" onSubmit={submit}>
        <p className="kiona legal-eyebrow">GLOWFIT</p>
        <h1 className="section-title small">PANEL DE TIENDA</h1>
        <label>Email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Contraseña<input type="password" autoComplete={mode === 'up' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {msg && <p className="form-note" role="alert">{msg}</p>}
        <button className="btn full" disabled={busy}>{busy ? 'Un momento…' : mode === 'in' ? 'Entrar' : 'Crear mi acceso'}</button>
        <button type="button" className="link-btn" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg(''); }}>
          {mode === 'in' ? 'Primera vez: crear mi acceso' : 'Ya tengo acceso: entrar'}
        </button>
      </form>
    </section>
  );
}

function Panel({ email }: { email: string }) {
  const [tab, setTab] = useState<'orders' | 'products' | 'customers'>('orders');
  return (
    <section className="admin">
      <header className="admin-top">
        <div>
          <p className="kiona legal-eyebrow">PANEL GLOWFIT</p>
          <nav className="admin-tabs" aria-label="Secciones">
            {([['orders', 'Pedidos'], ['products', 'Productos'], ['customers', 'Clientes']] as const).map(([k, l]) => (
              <button key={k} className={tab === k ? 'active' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>{l}</button>
            ))}
          </nav>
        </div>
        <div className="admin-user"><span>{email}</span><button className="link-btn" onClick={() => sb().auth.signOut()}>Salir</button></div>
      </header>
      {tab === 'orders' && <Orders />}
      {tab === 'products' && <Products />}
      {tab === 'customers' && <Customers />}
    </section>
  );
}

/* ---------- Pedidos ---------- */
function Orders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState('todos');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Order | null>(null);
  const load = useCallback(async () => {
    const { data } = await sb().from('orders').select('*').order('created_at', { ascending: false }).limit(500);
    setOrders((data as Order[]) ?? []);
  }, []);
  useEffect(() => {
    load();
    const ch = sb().channel('orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load).subscribe();
    const t = setInterval(load, 60000);
    return () => { sb().removeChannel(ch); clearInterval(t); };
  }, [load]);
  const list = useMemo(() => (orders ?? []).filter((o) =>
    (filter === 'todos' || o.fulfillment === filter) &&
    (!q || `${o.order_number} ${o.name} ${o.email} ${o.phone}`.toLowerCase().includes(q.toLowerCase()))), [orders, filter, q]);
  const today = (orders ?? []).filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString());
  const pending = (orders ?? []).filter((o) => o.fulfillment === 'nuevo' || o.fulfillment === 'preparando').length;

  if (!orders) return <p className="admin-empty">Cargando pedidos…</p>;
  return (
    <>
      <div className="admin-stats">
        <div><small>Pedidos hoy</small><strong>{today.length}</strong></div>
        <div><small>Ventas hoy</small><strong>{eur(today.reduce((n, o) => n + o.total_cents, 0))}</strong></div>
        <div><small>Por enviar</small><strong>{pending}</strong></div>
        <div><small>Total pedidos</small><strong>{orders.length}</strong></div>
      </div>
      <div className="admin-toolbar">
        <input type="search" placeholder="Buscar por nº, nombre, email o teléfono" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar pedidos" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrar por estado">
          <option value="todos">Todos los estados</option>
          {FULFILL.map((f) => <option key={f.v} value={f.v}>{f.l}</option>)}
        </select>
      </div>
      {list.length === 0 ? (
        <div className="admin-card admin-empty">{orders.length === 0 ? <><p><strong>Todavía no hay pedidos.</strong></p><p>Aparecerán aquí al momento en cuanto alguien pague.</p></> : <p>Ningún pedido coincide con la búsqueda.</p>}</div>
      ) : (
        <div className="admin-card admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Nº</th><th>Fecha y hora</th><th>Cliente</th><th>Total</th><th>Pago</th><th>Envío</th></tr></thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} onClick={() => setOpen(o)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpen(o)}>
                  <td><strong>#{o.order_number}</strong></td>
                  <td>{when(o.created_at)}</td>
                  <td>{o.name}<small>{o.email}</small></td>
                  <td>{eur(o.total_cents)}</td>
                  <td><span className={`pill pay-${o.status}`}>{o.status === 'paid' ? 'Pagado' : o.status}</span></td>
                  <td><span className={`pill f-${o.fulfillment}`}>{FULFILL.find((f) => f.v === o.fulfillment)?.l ?? o.fulfillment}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && <OrderDrawer order={open} onClose={() => setOpen(null)} onSaved={() => { load(); setOpen(null); }} />}
    </>
  );
}

function OrderDrawer({ order, onClose, onSaved }: { order: Order; onClose: () => void; onSaved: () => void }) {
  const [fulfillment, setF] = useState(order.fulfillment);
  const [tracking, setT] = useState(order.tracking ?? '');
  const [notes, setN] = useState(order.notes ?? '');
  const [busy, setBusy] = useState(false);
  const a = order.shipping_address ?? {};
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  async function save() {
    setBusy(true);
    await sb().from('orders').update({ fulfillment, tracking: tracking || null, notes: notes || null }).eq('id', order.id);
    setBusy(false); onSaved();
  }
  return (
    <div className="drawer-bg" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`Pedido ${order.order_number}`} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head"><h2>Pedido #{order.order_number}</h2><button className="icon-btn" onClick={onClose} aria-label="Cerrar">✕</button></div>
        <p className="muted">{when(order.created_at)} · {order.status === 'paid' ? 'Pagado' : order.status}{order.email_sent_at ? ' · Email de confirmación enviado' : ''}</p>
        <div className="drawer-grid">
          <div><h3>Cliente</h3><p>{order.name}<br /><a href={`mailto:${order.email}`}>{order.email}</a>{order.phone && <><br /><a href={`tel:${order.phone}`}>{order.phone}</a></>}</p>
            {order.accepts_marketing === false && <p className="muted">No quiere emails de promociones</p>}</div>
          <div><h3>Dirección de envío</h3><p>{a.line1}{a.line2 && <><br />{a.line2}</>}<br />{a.postal_code} {a.city}<br />{a.state}{a.country && a.country !== 'ES' ? `, ${a.country}` : ''}</p></div>
        </div>
        <h3>Productos</h3>
        <ul className="drawer-items">
          {order.items?.map((i, n) => <li key={n}><span>{i.qty} × {i.name}</span><span>{eur(i.total_cents)}</span></li>)}
          <li className="muted"><span>Envío</span><span>{order.shipping_cents ? eur(order.shipping_cents) : 'Gratis'}</span></li>
          <li className="total"><span>Total</span><span>{eur(order.total_cents)}</span></li>
        </ul>
        <h3>Gestión</h3>
        <label>Estado del envío<select value={fulfillment} onChange={(e) => setF(e.target.value)}>{FULFILL.map((f) => <option key={f.v} value={f.v}>{f.l}</option>)}</select></label>
        <label>Nº de seguimiento<input value={tracking} onChange={(e) => setT(e.target.value)} placeholder="Ej. código de Correos o SEUR" /></label>
        <label>Notas internas<textarea rows={3} value={notes} onChange={(e) => setN(e.target.value)} /></label>
        <div className="drawer-actions"><button className="btn btn-small" onClick={save} disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button><button className="link-btn" onClick={onClose}>Cancelar</button></div>
      </aside>
    </div>
  );
}

/* ---------- Productos ---------- */
const EMPTY: Product = { slug: '', name: '', category: 'Vitaminas', tagline: '', short_description: '', description: '', price_cents: 0, images: [], active: true, sort: 99 };

function Products() {
  const [items, setItems] = useState<Product[] | null>(null);
  const [edit, setEdit] = useState<Product | null>(null);
  const load = useCallback(async () => {
    const { data } = await sb().from('products').select('*').order('sort');
    setItems((data as Product[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  async function toggle(p: Product) {
    await sb().from('products').update({ active: !p.active }).eq('id', p.id!);
    load();
  }
  if (!items) return <p className="admin-empty">Cargando productos…</p>;
  if (edit) return <ProductForm initial={edit} onDone={() => { setEdit(null); load(); }} />;
  return (
    <>
      <div className="admin-toolbar end"><button className="btn btn-small" onClick={() => setEdit({ ...EMPTY, sort: items.length + 1 })}>+ Añadir producto</button></div>
      <ul className="admin-products">
        {items.map((p) => (
          <li key={p.id} className={`admin-card${p.active ? '' : ' off'}`}>
            <img src={p.images?.[0]} alt="" />
            <div className="ap-info"><strong>{p.name}</strong><small>{p.category} · {eur(p.price_cents)}</small>{!p.active && <span className="pill">Oculto</span>}</div>
            <div className="ap-actions">
              <button className="btn btn-small" onClick={() => setEdit(p)}>Editar</button>
              <button className="link-btn" onClick={() => toggle(p)}>{p.active ? 'Ocultar de la tienda' : 'Mostrar en la tienda'}</button>
            </div>
          </li>
        ))}
      </ul>
      <p className="muted small-note">Los cambios aparecen en la web en unos minutos.</p>
    </>
  );
}

const htmlToText = (h: string | null) => (h ?? '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>\s*<p[^>]*>/gi, '\n\n').replace(/<li[^>]*>/gi, '• ').replace(/<\/li>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n').trim();
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const textToHtml = (t: string) => t.trim() ? t.trim().split(/\n{2,}/).map((b) => `<p>${esc(b).replace(/\n/g, '<br />')}</p>`).join('') : null;
const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function ProductForm({ initial, onDone }: { initial: Product; onDone: () => void }) {
  const [p, setP] = useState<Product>({ ...initial, tagline: initial.tagline ?? '', short_description: htmlToText(initial.short_description), description: htmlToText(initial.description) });
  const [price, setPrice] = useState(initial.price_cents ? (initial.price_cents / 100).toFixed(2).replace('.', ',') : '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));
  const isNew = !initial.id;

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setMsg('');
    const now = new Date();
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      const path = `uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${Date.now()}-${slugify(f.name.replace(/\.[^.]+$/, ''))}.${f.name.split('.').pop()?.toLowerCase()}`;
      const { error } = await sb().storage.from('media').upload(path, f, { contentType: f.type, upsert: false });
      if (error) { setMsg('No se pudo subir una imagen. Prueba con otra o más pequeña.'); continue; }
      urls.push(sb().storage.from('media').getPublicUrl(path).data.publicUrl);
    }
    set('images', [...p.images, ...urls]);
    setBusy(false);
  }
  const move = (i: number, d: number) => { const a = [...p.images]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; set('images', a); };

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg('');
    const cents = Math.round(Number(price.replace(/\./g, '').replace(',', '.')) * 100);
    if (!p.name.trim()) return setMsg('Escribe el nombre del producto.');
    if (!cents || cents < 50) return setMsg('Escribe un precio válido, por ejemplo 29,90.');
    if (!p.images.length) return setMsg('Añade al menos una foto.');
    setBusy(true);
    const row = { ...p, slug: p.slug || slugify(p.name), price_cents: cents, tagline: p.tagline || null, short_description: textToHtml(p.short_description ?? ''), description: textToHtml(p.description ?? '') };
    const { error } = isNew ? await sb().from('products').insert(row) : await sb().from('products').update(row).eq('id', p.id!);
    setBusy(false);
    if (error) return setMsg(error.message.includes('duplicate') ? 'Ya existe un producto con esa dirección web. Cambia el nombre o la dirección.' : 'No se pudo guardar. Inténtalo de nuevo.');
    onDone();
  }

  return (
    <form className="admin-card product-form" onSubmit={save}>
      <div className="drawer-head"><h2>{isNew ? 'Nuevo producto' : `Editar ${initial.name}`}</h2><button type="button" className="link-btn" onClick={onDone}>← Volver</button></div>
      <div className="pf-grid">
        <label>Nombre<input value={p.name} onChange={(e) => set('name', e.target.value)} required /></label>
        <label>Precio (€, IVA incluido)<input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="29,90" required /></label>
        <label>Categoría<input value={p.category ?? ''} onChange={(e) => set('category', e.target.value)} list="cats" /><datalist id="cats"><option value="Vitaminas" /><option value="PACKS" /></datalist></label>
        <label>Orden en la tienda<input type="number" value={p.sort} onChange={(e) => set('sort', Number(e.target.value))} /></label>
      </div>
      <label>Frase corta bajo el nombre (para qué sirve)<input value={p.tagline ?? ''} maxLength={110} onChange={(e) => set('tagline', e.target.value)} placeholder="Ej. Drenante: ayuda a eliminar líquidos retenidos e hinchazón." /></label>
      <label>Descripción principal<textarea rows={5} value={p.short_description ?? ''} onChange={(e) => set('short_description', e.target.value)} /></label>
      <label>Más información (modo de empleo, ingredientes…)<textarea rows={6} value={p.description ?? ''} onChange={(e) => set('description', e.target.value)} /></label>
      <div>
        <p className="pf-label">Fotos <small>(la primera es la principal)</small></p>
        <ul className="pf-images">
          {p.images.map((src, i) => (
            <li key={src}><img src={src} alt="" />
              <div><button type="button" onClick={() => move(i, -1)} aria-label="Mover a la izquierda" disabled={i === 0}>←</button>
                <button type="button" onClick={() => move(i, 1)} aria-label="Mover a la derecha" disabled={i === p.images.length - 1}>→</button>
                <button type="button" onClick={() => set('images', p.images.filter((x) => x !== src))} aria-label="Quitar foto">✕</button></div>
            </li>
          ))}
          <li className="pf-upload"><label>+ Subir fotos<input type="file" accept="image/*" multiple onChange={(e) => upload(e.target.files)} hidden /></label></li>
        </ul>
      </div>
      <label className="accept"><input type="checkbox" checked={p.active} onChange={(e) => set('active', e.target.checked)} /><span>Visible en la tienda</span></label>
      {msg && <p className="error" role="alert">{msg}</p>}
      <div className="drawer-actions"><button className="btn btn-small" disabled={busy}>{busy ? 'Guardando…' : 'Guardar producto'}</button><button type="button" className="link-btn" onClick={onDone}>Cancelar</button></div>
    </form>
  );
}

/* ---------- Clientes ---------- */
function Customers() {
  const [rows, setRows] = useState<Customer[] | null>(null);
  useEffect(() => { sb().from('customers').select('id,created_at,name,email,phone,accepts_marketing').order('created_at', { ascending: false }).limit(2000).then(({ data }) => setRows((data as Customer[]) ?? [])); }, []);
  const unique = useMemo(() => { const m = new Map<string, Customer>(); (rows ?? []).forEach((r) => { if (!m.has(r.email)) m.set(r.email, r); }); return [...m.values()]; }, [rows]);
  function csv() {
    const lines = [['Nombre', 'Email', 'Teléfono', 'Acepta promociones', 'Fecha'], ...unique.map((r) => [r.name, r.email, r.phone, r.accepts_marketing ? 'Sí' : 'No', when(r.created_at)])];
    const blob = new Blob(['﻿' + lines.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'clientes-glowfit.csv'; a.click();
  }
  if (!rows) return <p className="admin-empty">Cargando clientes…</p>;
  return (
    <>
      <div className="admin-toolbar"><p className="muted">{unique.length} clientes registrados · {unique.filter((r) => r.accepts_marketing).length} aceptan promociones</p>{unique.length > 0 && <button className="btn btn-small" onClick={csv}>Descargar Excel (CSV)</button>}</div>
      {unique.length === 0 ? <div className="admin-card admin-empty"><p>Aquí aparecerá cada persona que rellene sus datos en el carrito.</p></div> : (
        <div className="admin-card admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Promociones</th><th>Fecha</th></tr></thead>
            <tbody>{unique.map((r) => <tr key={r.id}><td>{r.name}</td><td>{r.email}</td><td>{r.phone}</td><td>{r.accepts_marketing ? 'Sí' : 'No'}</td><td>{when(r.created_at)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
