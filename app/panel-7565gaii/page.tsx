'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { sb } from '@/lib/supabase-browser';
import { media } from '@/lib/config';
import { Icon, ToastProvider, type Order } from '@/components/admin/ui';
import Dashboard from '@/components/admin/Dashboard';
import Orders from '@/components/admin/Orders';
import Products from '@/components/admin/Products';
import Customers from '@/components/admin/Customers';
import Settings from '@/components/admin/Settings';
import Inventory from '@/components/admin/Inventory';
import SiteEditor from '@/components/admin/SiteEditor';

type Tab = 'home' | 'orders' | 'products' | 'inventory' | 'editor' | 'customers' | 'settings';
const NAV: { k: Tab; l: string; i: string }[] = [
  { k: 'home', l: 'Resumen', i: 'home' },
  { k: 'orders', l: 'Pedidos', i: 'orders' },
  { k: 'products', l: 'Productos', i: 'box' },
  { k: 'inventory', l: 'Inventario', i: 'stock' },
  { k: 'editor', l: 'Editar la web', i: 'layout' },
  { k: 'customers', l: 'Clientes', i: 'users' },
  { k: 'settings', l: 'Ajustes', i: 'gear' },
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
  const [mode, setMode] = useState<'password' | 'link' | 'signup'>('password');
  const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    if (mode === 'link') {
      // Enlace de un solo uso al email (caduca en 1 hora). Solo entra si el email es administrador.
      const { error } = await sb().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/panel-7565gaii/` } });
      if (error) setMsg(error.status === 429 ? 'Has pedido muchos enlaces. Espera unos minutos.' : 'No se pudo enviar el enlace. Revisa el email.');
      else setSent(true);
    } else if (mode === 'signup') {
      if (password.length < 8) { setMsg('Usa al menos 8 caracteres.'); setBusy(false); return; }
      const { data, error } = await sb().auth.signUp({ email: email.trim(), password });
      // Los emails de administrador se confirman solos: si no vino sesión, intentamos entrar directamente
      const ok = !error && (data.session || !(await sb().auth.signInWithPassword({ email: email.trim(), password })).error);
      if (error) setMsg(error.status === 429 ? 'Demasiados intentos. Espera unos minutos.' : 'No se pudo crear la cuenta. Prueba con otra contraseña.');
      else if (!ok) setMsg('Ese email ya tiene cuenta o no tiene permiso de administrador. Usa otro email de administrador o entra con enlace.');
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
        <p className="ad-muted">Te hemos enviado un enlace de acceso a <strong>{email}</strong>. Solo funciona una vez y caduca en 1 hora.</p>
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
        {mode !== 'link' && <label className="ad-field"><span>{mode === 'signup' ? 'Elige una contraseña (mínimo 8 caracteres)' : 'Contraseña'}</span>
          <span className="ad-input-icon"><input type={show ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}><Icon name={show ? 'eyeoff' : 'eye'} /></button></span>
        </label>}
        {msg && <p className="ad-error" role="alert">{msg}</p>}
        <button className="ad-btn primary full lg" disabled={busy}>{busy ? <span className="ad-spinner sm" /> : mode === 'link' ? 'Enviarme un enlace de acceso' : mode === 'signup' ? 'Crear cuenta y entrar' : 'Entrar'}</button>
        <div className="ad-login-modes">
          {mode !== 'password' && <button type="button" className="ad-link" onClick={() => { setMode('password'); setMsg(''); }}>Entrar con contraseña</button>}
          {mode !== 'link' && <button type="button" className="ad-link" onClick={() => { setMode('link'); setMsg(''); }}>Entrar con enlace al email</button>}
          {mode !== 'signup' && <button type="button" className="ad-link" onClick={() => { setMode('signup'); setMsg(''); }}>Crear cuenta</button>}
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
  const [menu, setMenu] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [focusOrder, setFocusOrder] = useState<string | null>(null);

  useEffect(() => {
    try { const t = sessionStorage.getItem('ad-tab') as Tab | null; if (t && NAV.some((n) => n.k === t)) setTab(t); } catch {}
  }, []);
  const go = (t: Tab) => { setTab(t); setMenu(false); try { sessionStorage.setItem('ad-tab', t); } catch {} window.scrollTo({ top: 0 }); };

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

  return (
    <div className={`ad-app${menu ? ' menu-open' : ''}`}>
      <aside className="ad-side" aria-label="Menú del panel">
        <div className="ad-side-top"><Brand /><button className="ad-icon-btn ad-only-mobile" onClick={() => setMenu(false)} aria-label="Cerrar menú"><Icon name="x" /></button></div>
        <nav className="ad-nav">
          {NAV.map((n) => (
            <button key={n.k} className={tab === n.k ? 'active' : ''} aria-current={tab === n.k ? 'page' : undefined} onClick={() => go(n.k)}>
              <Icon name={n.i} /><span>{n.l}</span>{n.k === 'orders' && pending > 0 && <em className="ad-count">{pending}</em>}
            </button>
          ))}
        </nav>
        <div className="ad-side-foot">
          <a className="ad-nav-link" href="/" target="_blank" rel="noopener"><Icon name="ext" /><span>Ver la tienda</span></a>
          <div className="ad-user"><span className="ad-avatar">{email.charAt(0).toUpperCase()}</span><span className="ad-user-mail">{email}</span>
            <button className="ad-icon-btn" onClick={() => sb().auth.signOut()} aria-label="Cerrar sesión" title="Cerrar sesión"><Icon name="out" /></button></div>
        </div>
      </aside>
      <div className="ad-scrim" onClick={() => setMenu(false)} />
      <main className="ad-main">
        <header className="ad-topbar">
          <button className="ad-icon-btn ad-only-mobile" onClick={() => setMenu(true)} aria-label="Abrir menú"><Icon name="menu" /></button>
          <h1>{current.l}</h1>
          <span className="ad-live" title="Los pedidos se actualizan solos"><i />En directo</span>
        </header>
        <div className="ad-page" key={tab}>
          {tab === 'home' && <Dashboard orders={orders} openOrder={(id) => { setFocusOrder(id); go('orders'); }} goOrders={() => go('orders')} />}
          {tab === 'orders' && <Orders orders={orders} reload={loadOrders} focusId={focusOrder} clearFocus={() => setFocusOrder(null)} />}
          {tab === 'products' && <Products />}
          {tab === 'inventory' && <Inventory />}
          {tab === 'editor' && <SiteEditor />}
          {tab === 'customers' && <Customers />}
          {tab === 'settings' && <Settings email={email} />}
        </div>
      </main>
    </div>
  );
}
