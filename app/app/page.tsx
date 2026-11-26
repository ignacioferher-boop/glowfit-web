'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { media } from '@/lib/config';

type Item = { id: string; text: string };
type Content = { id: string; kind: 'receta' | 'entrenamiento' | 'tip'; title: string; summary: string | null; body: string | null; image_url: string | null };
type State = { auth: true; name: string | null; has_guide: boolean; day: string; checklist: Item[]; done: string[]; week: { day: string; n: number }[]; content: Content[] };
type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const KINDS: { k: 'all' | Content['kind']; l: string }[] = [{ k: 'all', l: 'Todo' }, { k: 'receta', l: 'Recetas' }, { k: 'entrenamiento', l: 'Entrenamientos' }, { k: 'tip', l: 'Tips' }];
const KIND_LABEL: Record<Content['kind'], string> = { receta: 'Receta', entrenamiento: 'Entrenamiento', tip: 'Tip' };

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
function env() {
  if (typeof window === 'undefined') return { standalone: false, ios: false, android: false, safari: false, platform: '' };
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  const safari = ios && !/CriOS|FxiOS|EdgiOS|Instagram|FBAN|FBAV|GSA|Line\//.test(ua);
  return { standalone, ios, android, safari, platform: ios ? 'iPhone' : android ? 'Android' : 'Ordenador' };
}
const first = (n: string | null) => { const f = (n || '').trim().split(/\s+/)[0] || ''; return f ? f[0].toUpperCase() + f.slice(1).toLowerCase() : ''; };

export default function GlowApp() {
  const [st, setSt] = useState<State | null>(null);
  const [auth, setAuth] = useState<boolean | null>(null);
  const [e, setE] = useState(env());
  const [bip, setBip] = useState<BIP | null>(null);
    const installedRef = useRef(false);

  const load = useCallback(async () => {
    const en = env();
    const q = new URLSearchParams({ day: today(), installed: en.standalone || installedRef.current ? '1' : '0', platform: en.platform });
    const r = await fetch(`/api/app/state/?${q}`, { cache: 'no-store' }).catch(() => null);
    if (!r) { setAuth((a) => a ?? false); return; }
    const d = await r.json().catch(() => ({}));
    if (d.auth) { setSt(d as State); setAuth(true); } else { setSt(null); setAuth(false); }
  }, []);

  useEffect(() => {
    setE(env());
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' }).catch(() => {});
    const onBip = (ev: Event) => { ev.preventDefault(); setBip(ev as BIP); };
    const onInstalled = () => { installedRef.current = true; setBip(null); load(); };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    load();
    const onVis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInstalled); document.removeEventListener('visibilitychange', onVis); };
  }, [load]);

  if (auth === null) return <div className="gf-app"><div className="gf-center"><span className="gf-spin" aria-label="Cargando" /></div></div>;
  // iPhone: solo se puede usar instalada en la pantalla de inicio (obligatorio, decisión de Glowfit)
  if (e.ios && !e.standalone) return <div className="gf-app"><IosInstall safari={e.safari} /></div>;
  if (!auth || !st) return <div className="gf-app"><Activate onDone={load} /></div>;
  return <div className="gf-app"><Home st={st} setSt={setSt} reload={load} env={e} bip={bip} onInstall={async () => { if (!bip) return; await bip.prompt(); const c = await bip.userChoice; if (c.outcome === 'accepted') { installedRef.current = true; setBip(null); load(); } }} /></div>;
}

function Logo() { return <img className="gf-logo" src={media('2026/05/LOGO-GLOWFIT.png')} alt="Glowfit" />; }

function ShareIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4" /><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" /></svg>;
}
function PlusSq() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M12 8v8M8 12h8" /></svg>;
}

function IosInstall({ safari }: { safari: boolean }) {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(0);
  useEffect(() => { const c = new URLSearchParams(location.search).get('c'); if (c) setCode(c.toUpperCase()); }, []);
  // Demostración animada: va pasando por los 3 pasos
  useEffect(() => { const t = setInterval(() => setStep((s) => (s + 1) % 3), 2600); return () => clearInterval(t); }, []);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} };
  return (
    <div className="gf-screen gf-install">
      <Logo />
      <h1>Instala tu app Glowfit</h1>
      <p className="gf-muted">La app de Glowfit solo funciona instalada en tu pantalla de inicio. Es gratis y tardas 20 segundos.</p>
      {!safari && <p className="gf-alert">Primero ábrela en <strong>Safari</strong>: copia la dirección <strong>glowfit.group/app</strong> y pégala en Safari. Desde otras apps (Instagram, Gmail…) no se puede instalar.</p>}
      <Demo step={step} />
      <ol className="gf-steps">
        <li className={step === 0 ? 'on' : ''}><span>1</span><div>Pulsa el botón <strong>Compartir</strong> <i className="gf-ic"><ShareIcon /></i> de Safari. <small>Si no lo ves, toca primero los tres puntos <strong>···</strong> de la barra de abajo.</small></div></li>
        <li className={step === 1 ? 'on' : ''}><span>2</span><div>Desliza hacia abajo y toca <strong>«Añadir a pantalla de inicio»</strong> <i className="gf-ic"><PlusSq /></i> <small>Si no aparece, toca «Ver más» o «Editar acciones».</small></div></li>
        <li className={step === 2 ? 'on' : ''}><span>3</span><div>Pulsa <strong>«Añadir»</strong> y abre la app desde el nuevo icono de Glowfit en tu pantalla.</div></li>
      </ol>
      {code && (
        <div className="gf-codebox">
          <small>Tu código: lo necesitarás al abrir la app</small>
          <strong>{code}</strong>
          <button className="gf-btn ghost sm" onClick={copy}>{copied ? 'Copiado ✓' : 'Copiar código'}</button>
        </div>
      )}
      <p className="gf-muted sm">¿Ya la tienes instalada? Ciérrala aquí y ábrela desde el icono de Glowfit.<br />¿Problemas? <a href="https://wa.me/34722406293" target="_blank" rel="noopener">Escríbenos por WhatsApp</a> y te ayudamos.</p>
    </div>
  );
}

// Mini animación de un iPhone mostrando dónde pulsar en cada paso
function Demo({ step }: { step: number }) {
  return (
    <div className="gf-demo" aria-hidden="true">
      <div className="gf-phone">
        <div className={`gf-scene s0${step === 0 ? ' on' : ''}`}>
          <div className="gf-page"><i /><i /><i className="short" /></div>
          <div className="gf-bar"><span>‹</span><span>›</span><span className="gf-tap"><ShareIcon /></span><span>▢</span><span>···</span></div>
        </div>
        <div className={`gf-scene s1${step === 1 ? ' on' : ''}`}>
          <div className="gf-sheetmock">
            <div className="row">Copiar</div>
            <div className="row">Añadir a favoritos</div>
            <div className="row gf-tap">Añadir a pantalla de inicio <PlusSq /></div>
            <div className="row">Buscar en la página</div>
          </div>
        </div>
        <div className={`gf-scene s2${step === 2 ? ' on' : ''}`}>
          <div className="gf-addmock">
            <div className="top"><span>Cancelar</span><b className="gf-tap">Añadir</b></div>
            <div className="mid"><img src="/img/app-icon-180.png" alt="" /><span>Glowfit</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Activate({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { const c = new URLSearchParams(location.search).get('c'); if (c) setCode(c.toUpperCase()); }, []);
  async function submit(ev: React.FormEvent) {
    ev.preventDefault(); setBusy(true); setErr('');
    const r = await fetch('/api/app/activate/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : { error: 'Sin conexión. Inténtalo de nuevo.' };
    setBusy(false);
    if (r?.ok) { history.replaceState(null, '', '/app/'); onDone(); } else setErr(d.error || 'No se pudo entrar.');
  }
  return (
    <div className="gf-screen gf-activate">
      <Logo />
      <p className="gf-script">tu momento</p>
      <h1>Tu espacio Glowfit</h1>
      <p className="gf-muted">Introduce el código personal que te enviamos por email al hacer tu compra.</p>
      <form onSubmit={submit} className="gf-form">
        <label htmlFor="gf-code">Tu código</label>
        <input id="gf-code" value={code} onChange={(ev) => { setCode(ev.target.value.toUpperCase()); setErr(''); }} placeholder="GLOW-XXXX-XXXX" autoCapitalize="characters" autoComplete="one-time-code" spellCheck={false} inputMode="text" required />
        {err && <p className="gf-error" role="alert">{err}</p>}
        <button className="gf-btn" disabled={busy || code.replace(/[^A-Z0-9]/gi, '').length < 8}>{busy ? <span className="gf-spin sm" /> : 'Entrar'}</button>
      </form>
      <p className="gf-muted sm">¿No encuentras tu código? Busca en tu correo «acceso a la app Glowfit» (mira también en promociones o spam) o <a href="/sobre-nosotros/">escríbenos</a> y te lo reenviamos.</p>
      <p className="gf-muted sm">¿Aún no eres cliente? <a href="/productos/">Descubre los productos Glowfit</a>: con tu compra tienes acceso a la app.</p>
    </div>
  );
}

function Home({ st, setSt, reload, env: e, bip, onInstall }: { st: State; setSt: (s: State) => void; reload: () => void; env: ReturnType<typeof env>; bip: BIP | null; onInstall: () => void }) {
  const [kind, setKind] = useState<'all' | Content['kind']>('all');
  const [open, setOpen] = useState<Content | null>(null);
  const [hideBanner, setHideBanner] = useState(false);
  const done = new Set(st.done);
  const total = st.checklist.length;
  const n = st.checklist.filter((i) => done.has(i.id)).length;
  const items = st.content.filter((c) => kind === 'all' || c.kind === kind);
  const kinds = KINDS.filter((k) => k.k === 'all' || st.content.some((c) => c.kind === k.k));
  const name = first(st.name);
  const dateLabel = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' });

  // Si cambia el día con la app abierta, recarga la checklist
  useEffect(() => { const t = setInterval(() => { if (today() !== st.day) reload(); }, 60000); return () => clearInterval(t); }, [st.day, reload]);

  async function toggle(id: string) {
    const on = !done.has(id);
    const next = on ? [...st.done, id] : st.done.filter((x) => x !== id);
    setSt({ ...st, done: next });
    if (on && next.length === total && navigator.vibrate) navigator.vibrate(30);
    const r = await fetch('/api/app/toggle/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ item: id, day: st.day, done: on }) }).catch(() => null);
    if (!r?.ok) reload();
  }

  const week = useMemo(() => {
    const map = new Map(st.week.map((w) => [w.day, w.n]));
    const base = new Date(`${st.day}T12:00:00Z`);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(base); d.setUTCDate(base.getUTCDate() - (6 - i));
      const k = d.toISOString().slice(0, 10);
      const c = k === st.day ? n : map.get(k) ?? 0;
      return { k, l: d.toLocaleDateString('es-ES', { weekday: 'narrow', timeZone: 'UTC' }).toUpperCase(), pct: total ? Math.min(1, c / total) : 0, today: k === st.day };
    });
  }, [st.week, st.day, n, total]);

  async function logout() {
    await fetch('/api/app/logout/', { method: 'POST' }).catch(() => null);
    location.reload();
  }

  const showInstall = !e.standalone && !hideBanner;
  return (
    <div className="gf-home">
      <header className="gf-top">
        <img className="gf-logo sm" src={media('2026/05/LOGO-GLOWFIT.png')} alt="Glowfit" />
      </header>
      <section className="gf-hello">
        <p className="gf-date">{dateLabel}</p>
        <h1>{name ? <>Hola, {name}</> : <>Hola</>}</h1>
        <p className="gf-muted">{n === total && total > 0 ? '¡Checklist completa! Hoy te has cuidado un montón.' : 'Tu momento de hoy, paso a paso.'}</p>
      </section>

      {showInstall && (
        <section className="gf-banner">
          <img src="/img/app-icon-180.png" alt="" width={44} height={44} />
          <div>
            <strong>Llévala en tu móvil</strong>
            <span>{bip ? 'Instálala y ábrela desde su icono.' : e.ios ? 'Compartir → «Añadir a pantalla de inicio».' : e.android ? 'Menú ⋮ → «Instalar aplicación».' : 'Ábrela desde tu móvil e instálala.'}</span>
          </div>
          {bip ? <button className="gf-btn sm" onClick={onInstall}>Descargar la aplicación</button> : <button className="gf-x" onClick={() => setHideBanner(true)} aria-label="Ocultar">×</button>}
        </section>
      )}

      <section className="gf-card gf-check">
        <div className="gf-check-head">
          <div><h2>Tu checklist de hoy</h2><p className="gf-muted sm">{n} de {total} hechos</p></div>
          <Ring pct={total ? n / total : 0} />
        </div>
        <ul>
          {st.checklist.map((i) => (
            <li key={i.id}>
              <button className={done.has(i.id) ? 'on' : ''} onClick={() => toggle(i.id)} aria-pressed={done.has(i.id)}>
                <span className="gf-box" aria-hidden="true">{done.has(i.id) && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>}</span>
                <span>{i.text}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="gf-week" aria-label="Tu semana">
          {week.map((w) => <div key={w.k} className={w.today ? 'today' : ''}><i style={{ ['--p' as string]: w.pct }} /><small>{w.l}</small></div>)}
        </div>
      </section>

      {st.content.length > 0 && (
        <section className="gf-ideas">
          <h2>Ideas para tu día</h2>
          <div className="gf-chips" role="tablist">
            {kinds.map((k) => <button key={k.k} role="tab" aria-selected={kind === k.k} className={kind === k.k ? 'on' : ''} onClick={() => setKind(k.k)}>{k.l}</button>)}
          </div>
          <div className="gf-carousel">
            {items.map((c) => (
              <button key={c.id} className={`gf-slide k-${c.kind}`} onClick={() => setOpen(c)}>
                {c.image_url ? <img src={c.image_url} alt="" loading="lazy" /> : <span className="gf-slide-ph" aria-hidden="true">{c.kind === 'receta' ? '🥗' : c.kind === 'entrenamiento' ? '🧘‍♀️' : '🌿'}</span>}
                <span className="gf-slide-body"><em>{KIND_LABEL[c.kind]}</em><strong>{c.title}</strong>{c.summary && <small>{c.summary}</small>}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className={`gf-card gf-guide${st.has_guide ? '' : ' locked'}`}>
        <img src="/img/guia-portada.webp" alt="" />
        <div>
          <em>Tu guía</em>
          <h2>Tu momento, cada día</h2>
          {st.has_guide
            ? <><p className="gf-muted sm">Hábitos, ideas y planes sencillos para acompañarte.</p><a className="gf-btn sm" href="/api/app/guia/" target="_blank" rel="noopener">Abrir la guía</a></>
            : <><p className="gf-muted sm">Disponible con la compra de cualquier producto Glowfit o de la guía.</p><a className="gf-btn ghost sm" href="/productos/">Ver productos</a></>}
        </div>
      </section>

      <footer className="gf-foot">
        <p className="gf-muted sm">Contenido orientativo sobre hábitos. No sustituye el consejo de un profesional sanitario.</p>
        <a href="/" className="gf-link">Ir a la tienda</a> · <button className="gf-link" onClick={logout}>Salir</button>
      </footer>

      {open && <Sheet c={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 22; const c = 2 * Math.PI * r;
  return (
    <svg className="gf-ring" width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--gf-line)" strokeWidth="5" />
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--gf-olive)" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 28 28)" style={{ transition: 'stroke-dashoffset .4s ease' }} />
      <text x="28" y="32" textAnchor="middle" fontSize="13" fill="var(--gf-green)" fontWeight="600">{Math.round(pct * 100)}%</text>
    </svg>
  );
}

function Sheet({ c, onClose }: { c: Content; onClose: () => void }) {
  useEffect(() => {
    const k = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose();
    document.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="gf-overlay" onClick={onClose}>
      <article className="gf-sheet" role="dialog" aria-modal="true" aria-label={c.title} onClick={(ev) => ev.stopPropagation()}>
        <span className="gf-handle" />
        <button className="gf-x" onClick={onClose} aria-label="Cerrar">×</button>
        {c.image_url && <img src={c.image_url} alt="" />}
        <em>{KIND_LABEL[c.kind]}</em>
        <h2>{c.title}</h2>
        {c.summary && <p className="gf-muted">{c.summary}</p>}
        <div className="gf-body">{(c.body || '').split(/\n{2,}/).map((p, i) => <p key={i}>{p.split('\n').map((l, j) => <span key={j}>{l}<br /></span>)}</p>)}</div>
      </article>
    </div>
  );
}
