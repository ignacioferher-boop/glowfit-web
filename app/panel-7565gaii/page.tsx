'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { sb } from '@/lib/supabase-browser';
import { media } from '@/lib/config';
import { Icon, Modal, ToastProvider, type Order } from '@/components/admin/ui';
import Dashboard from '@/components/admin/Dashboard';
import Orders from '@/components/admin/Orders';
import Products from '@/components/admin/Products';
import Customers from '@/components/admin/Customers';
import Settings from '@/components/admin/Settings';
import Inventory from '@/components/admin/Inventory';
import SiteEditor from '@/components/admin/SiteEditor';
import Promos from '@/components/admin/Promos';
import ReviewsAdmin from '@/components/admin/ReviewsAdmin';
import FollowupsAdmin from '@/components/admin/FollowupsAdmin';

type Tab = 'home' | 'orders' | 'products' | 'inventory' | 'editor' | 'customers' | 'promos' | 'reviews' | 'followups' | 'settings';
type G = 'shop' | 'catalog' | 'web' | 'account';
const GROUPS: { k: G; l: string }[] = [{ k: 'shop', l: 'Ventas' }, { k: 'catalog', l: 'Catálogo' }, { k: 'web', l: 'Tu web' }, { k: 'account', l: 'Cuenta' }];
// m = aparece en la barra inferior del móvil; s = nombre corto
const NAV: { k: Tab; l: string; s?: string; i: string; d: string; g: G; m?: boolean }[] = [
  { k: 'home', l: 'Resumen', i: 'home', d: 'Cómo va la tienda de un vistazo', g: 'shop', m: true },
  { k: 'orders', l: 'Pedidos', i: 'orders', d: 'Prepara, envía y sigue cada pedido', g: 'shop', m: true },
  { k: 'customers', l: 'Clientes', i: 'users', d: 'Quién te ha comprado y sus datos', g: 'shop' },
  { k: 'followups', l: 'Seguimiento', i: 'mail', d: 'Mensajes a tus clientes tras la compra y sus respuestas', g: 'shop' },
  { k: 'promos', l: 'Descuentos', i: 'ticket', d: 'Códigos de descuento para tus clientes', g: 'shop' },
  { k: 'reviews', l: 'Opiniones', i: 'star', d: 'Valoraciones de clientes y cuáles publicar', g: 'shop' },
  { k: 'products', l: 'Productos', i: 'box', d: 'Precios, fotos, textos y packs', g: 'catalog', m: true },
  { k: 'inventory', l: 'Inventario', s: 'Stock', i: 'stock', d: 'Botes, entradas y avisos de stock', g: 'catalog', m: true },
  { k: 'editor', l: 'Editar la web', i: 'layout', d: 'Textos, fotos y secciones de tu web', g: 'web' },
  { k: 'settings', l: 'Ajustes', i: 'gear', d: 'Tu cuenta, envíos y pagos', g: 'account' },
];

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

  return (
    <div className="ad-root">
      <ToastProvider>
        {!ready || (session && isAdmin === null) ? <Splash /> : !session ? <Login /> : !isAdmin ? <NoAccess email={session.user.email ?? ''} /> : <App email={session.user.email ?? ''} />}
      </ToastProvider>
    </div>
  );
}

function Splash() { return <div className="ad-center"><span className="ad-spinner" aria-label="Cargando" /></div>; }

function Brand() { return <img className="ad-logo" src={media('2026/05/LOGO-GLOWFIT.png')} alt="Glowfit" />; }

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'password' | 'link'>('password');
  const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    if (mode === 'link') {
      // Enlace de un solo uso al email (caduca en 1 hora). Solo entra si el email es administrador.
      const { error } = await sb().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/panel-7565gaii/`, shouldCreateUser: false } });
      // No decimos si el email existe o no: si es de un administrador, le llega el enlace
      if (error?.status === 429) setMsg('Has pedido muchos enlaces. Espera unos minutos.');
      else setSent(true);
    } else {
      const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password });
      if (error) setMsg('El email o la contraseña no son correctos.');
    }
    setBusy(false);
  }
  if (sent) return (
    <div className="ad-login-bg" style={{ backgroundImage: `url(${media('2026/05/FONDO-COLOR-scaled.png')})` }}>
      <div className="ad-login ad-rise">
        <Brand />
        <h1>Revisa tu correo</h1>
        <p className="ad-muted">Si <strong>{email}</strong> es un email de administrador, te llegará un enlace de acceso en un momento. Solo funciona una vez y caduca en 1 hora. También sirve si has olvidado la contraseña.</p>
        <button className="ad-btn full" onClick={() => setSent(false)}>Volver</button>
      </div>
    </div>
  );
  return (
    <div className="ad-login-bg" style={{ backgroundImage: `url(${media('2026/05/FONDO-COLOR-scaled.png')})` }}>
      <form className="ad-login ad-rise" onSubmit={submit}>
        <Brand />
        <h1>Panel de la tienda</h1>
        <p className="ad-muted">Entra para gestionar pedidos, productos y clientes.</p>
        <label className="ad-field"><span>Email</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        {mode !== 'link' && <label className="ad-field"><span>Contraseña</span>
          <span className="ad-input-icon"><input type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}><Icon name={show ? 'eyeoff' : 'eye'} /></button></span>
        </label>}
        {msg && <p className="ad-error" role="alert">{msg}</p>}
        <button className="ad-btn primary full lg" disabled={busy}>{busy ? <span className="ad-spinner sm" /> : mode === 'link' ? 'Enviarme un enlace de acceso' : 'Entrar'}</button>
        <div className="ad-login-modes">
          {mode !== 'password' && <button type="button" className="ad-link" onClick={() => { setMode('password'); setMsg(''); }}>Entrar con contraseña</button>}
          {mode !== 'link' && <button type="button" className="ad-link" onClick={() => { setMode('link'); setMsg(''); }}>Entrar con enlace al email</button>}
        </div>
        <p className="ad-muted sm">Solo pueden entrar los emails autorizados como administrador.</p>
      </form>
    </div>
  );
}

function NoAccess({ email }: { email: string }) {
  return (
    <div className="ad-center">
      <div className="ad-card ad-rise ad-narrow center">
        <span className="ad-empty-icon"><Icon name="lock" size={26} /></span>
        <h2>Sin acceso</h2>
        <p className="ad-muted"><strong>{email}</strong> no tiene permiso para entrar en el panel.</p>
        <button className="ad-btn" onClick={() => sb().auth.signOut()}>Salir</button>
      </div>
    </div>
  );
}

function App({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>('home');
  const [more, setMore] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [focusOrder, setFocusOrder] = useState<string | null>(null);

  useEffect(() => {
    try { const t = sessionStorage.getItem('ad-tab') as Tab | null; if (t && NAV.some((n) => n.k === t)) setTab(t); } catch {}
  }, []);
  const go = (t: Tab) => { setTab(t); setMore(false); try { sessionStorage.setItem('ad-tab', t); } catch {} window.scrollTo({ top: 0 }); };

  const loadOrders = useCallback(async () => {
    const { data } = await sb().from('orders').select('*').order('created_at', { ascending: false }).limit(1000);
    setOrders((data as Order[]) ?? []);
  }, []);
  useEffect(() => {
    loadOrders();
    const ch = sb().channel('ad-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders()).subscribe();
    const t = setInterval(loadOrders, 60000);
    return () => { sb().removeChannel(ch); clearInterval(t); };
  }, [loadOrders]);

  const pending = (orders ?? []).filter((o) => o.fulfillment === 'nuevo').length;
  const current = NAV.find((n) => n.k === tab)!;
  const signOut = () => sb().auth.signOut();

  return (
    <div className={`ad-app${tab === 'editor' ? ' wide' : ''}`}>
      <aside className="ad-side" aria-label="Menú del panel">
        <div className="ad-side-top"><Brand /><span className="ad-side-tag">Panel</span></div>
        <nav className="ad-nav">
          {GROUPS.map((g) => (
            <div key={g.l} className="ad-nav-group">
              <p className="ad-nav-label">{g.l}</p>
              {NAV.filter((n) => n.g === g.k).map((n) => (
                <button key={n.k} className={tab === n.k ? 'active' : ''} aria-current={tab === n.k ? 'page' : undefined} onClick={() => go(n.k)}>
                  <Icon name={n.i} /><span>{n.l}</span>{n.k === 'orders' && pending > 0 && <em className="ad-count">{pending}</em>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="ad-side-foot">
          <a className="ad-nav-link" href="/" target="_blank" rel="noopener"><Icon name="ext" /><span>Ver la tienda</span></a>
          <div className="ad-user"><span className="ad-avatar">{email.charAt(0).toUpperCase()}</span><span className="ad-user-mail">{email}</span></div>
          <button className="ad-btn full ad-out" onClick={() => setConfirmOut(true)}><Icon name="out" />Cerrar sesión</button>
        </div>
      </aside>
      <main className="ad-main">
        <header className="ad-topbar">
          <div className="ad-topbar-title">
            <span className="ad-topbar-icon ad-only-mobile"><Icon name={current.i} /></span>
            <div><h1>{current.l}</h1><p className="ad-muted ad-topbar-sub">{current.d}</p></div>
          </div>
          <div className="ad-topbar-actions">
            <span className="ad-live" title="Los pedidos se actualizan solos"><i />En directo</span>
            <a className="ad-btn sm ad-hide-mobile" href="/" target="_blank" rel="noopener"><Icon name="ext" size={16} />Ver tienda</a>
            <button className="ad-btn sm ad-out-top" onClick={() => setConfirmOut(true)} aria-label="Salir del panel"><Icon name="out" size={16} /><span>Salir</span></button>
          </div>
        </header>
        <div className="ad-page" key={tab}>
          {tab === 'home' && <Dashboard orders={orders} openOrder={(id) => { setFocusOrder(id); go('orders'); }} goOrders={() => go('orders')} />}
          {tab === 'orders' && <Orders orders={orders} reload={loadOrders} focusId={focusOrder} clearFocus={() => setFocusOrder(null)} />}
          {tab === 'products' && <Products />}
          {tab === 'inventory' && <Inventory />}
          {tab === 'editor' && <SiteEditor onExit={() => go('home')} />}
          {tab === 'customers' && <Customers />}
          {tab === 'promos' && <Promos />}
          {tab === 'reviews' && <ReviewsAdmin />}
          {tab === 'followups' && <FollowupsAdmin />}
          {tab === 'settings' && <Settings email={email} />}
        </div>
      </main>

      <nav className="ad-tabbar" aria-label="Secciones">
        {NAV.filter((n) => n.m).map((n) => (
          <button key={n.k} className={tab === n.k ? 'active' : ''} onClick={() => go(n.k)} aria-current={tab === n.k ? 'page' : undefined}>
            <span className="ad-tab-ic"><Icon name={n.i} />{n.k === 'orders' && pending > 0 && <em>{pending}</em>}</span><small>{n.s ?? n.l}</small>
          </button>
        ))}
        <button className={more || !NAV.find((n) => n.k === tab)?.m ? 'active' : ''} onClick={() => setMore(true)}><span className="ad-tab-ic"><Icon name="menu" /></span><small>Más</small></button>
      </nav>

      {more && (
        <div className="ad-sheet-wrap" onClick={() => setMore(false)}>
          <div className="ad-sheet" role="dialog" aria-label="Más opciones" onClick={(e) => e.stopPropagation()}>
            <span className="ad-sheet-handle" />
            {NAV.filter((n) => !n.m).map((n) => (
              <button key={n.k} className={tab === n.k ? 'active' : ''} onClick={() => go(n.k)}><Icon name={n.i} /><span><strong>{n.l}</strong><small>{n.d}</small></span><Icon name="right" size={16} /></button>
            ))}
            <a href="/" target="_blank" rel="noopener"><Icon name="ext" /><span><strong>Ver la tienda</strong><small>Abre la web en otra pestaña</small></span><Icon name="right" size={16} /></a>
            <div className="ad-sheet-user"><span className="ad-avatar">{email.charAt(0).toUpperCase()}</span><span className="ad-user-mail">{email}</span></div>
            <button className="ad-btn full ad-out" onClick={() => { setMore(false); setConfirmOut(true); }}><Icon name="out" />Cerrar sesión</button>
          </div>
        </div>
      )}

      {confirmOut && (
        <Modal title="¿Salir del panel?" onClose={() => setConfirmOut(false)}>
          <p className="ad-muted">Tendrás que volver a entrar con tu email para gestionar la tienda. La web sigue funcionando normalmente.</p>
          <div className="ad-modal-actions">
            <button className="ad-btn" onClick={() => setConfirmOut(false)} data-autofocus>Seguir en el panel</button>
            <button className="ad-btn primary" onClick={signOut}><Icon name="out" />Salir</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
