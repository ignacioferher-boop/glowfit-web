'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { sb } from '@/lib/supabase-browser';
import { adminFetch } from '@/lib/admin-fetch';
import { Empty, Icon, Modal, Skeleton, Switch, ago, downloadCSV, useToast, when } from './ui';

type Member = { id: string; created_at: string; email: string; name: string | null; code: string; source: string; has_guide: boolean; code_expires_at: string; code_emailed_at: string | null; activated_at: string | null; last_seen_at: string | null; visits: number; installed_at: string | null; platform: string | null; revoked: boolean; order_number: number | null; checks_7d: number };
type Item = { id: string; text: string; sort: number; active: boolean };
type Content = { id: string; kind: 'receta' | 'entrenamiento' | 'tip'; title: string; summary: string | null; body: string | null; image_url: string | null; sort: number; active: boolean };
const KINDS = [{ v: 'receta', l: 'Receta' }, { v: 'entrenamiento', l: 'Entrenamiento' }, { v: 'tip', l: 'Tip' }] as const;

export default function AppAdmin() {
  const [view, setView] = useState<'members' | 'checklist' | 'content'>('members');
  return (
    <>
      <div className="ad-toolbar ad-rise" style={{ justifyContent: 'space-between' }}>
        <div className="ad-seg" role="tablist">
          {([['members', 'Clientes'], ['checklist', 'Checklist diaria'], ['content', 'Recetas, entrenos y tips']] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={view === k} className={view === k ? 'active' : ''} onClick={() => setView(k)}>{l}</button>
          ))}
        </div>
        <a className="ad-btn sm" href="/app/" target="_blank" rel="noopener"><Icon name="ext" size={16} />Abrir la app</a>
      </div>
      {view === 'members' && <Members />}
      {view === 'checklist' && <Checklist />}
      {view === 'content' && <Contents />}
    </>
  );
}

function status(m: Member) {
  if (m.revoked) return { k: 'cancelado', l: 'Bloqueado' };
  if (m.activated_at) return { k: 'entregado', l: 'Activado' };
  if (new Date(m.code_expires_at) < new Date()) return { k: 'nuevo', l: 'Código caducado' };
  return { k: 'preparando', l: 'Sin activar' };
}

function Members() {
  const toast = useToast();
  const [rows, setRows] = useState<Member[] | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'installed' | 'notinstalled'>('all');
  const [open, setOpen] = useState<Member | null>(null);
  const [adding, setAdding] = useState(false);
  const load = useCallback(async () => {
    const { data, error } = await sb().rpc('admin_app_members');
    if (error) toast('No se pudieron cargar los clientes de la app', 'err');
    setRows((data as Member[]) ?? []);
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const all = rows ?? [];
  const counts = {
    all: all.length,
    pending: all.filter((m) => !m.activated_at && !m.revoked).length,
    active: all.filter((m) => m.activated_at).length,
    installed: all.filter((m) => m.installed_at).length,
    notinstalled: all.filter((m) => m.activated_at && !m.installed_at).length,
  };
  const week = all.filter((m) => m.last_seen_at && Date.now() - new Date(m.last_seen_at).getTime() < 7 * 864e5).length;
  const list = all.filter((m) => (filter === 'all' || (filter === 'pending' && !m.activated_at && !m.revoked) || (filter === 'active' && m.activated_at) || (filter === 'installed' && m.installed_at) || (filter === 'notinstalled' && m.activated_at && !m.installed_at))
    && (!q || `${m.name} ${m.email} ${m.code} ${m.order_number ?? ''}`.toLowerCase().includes(q.toLowerCase())));

  if (!rows) return <Skeleton rows={6} />;
  return (
    <>
      <div className="ad-kpis">
        <div className="ad-kpi ad-rise"><span className="ad-kpi-icon"><Icon name="users" /></span><small>Con acceso a la app</small><strong>{counts.all}</strong></div>
        <div className="ad-kpi ad-rise" style={{ animationDelay: '60ms' }}><span className="ad-kpi-icon"><Icon name="check" /></span><small>Han entrado</small><strong>{counts.active}</strong><span className="ad-muted sm">{counts.all ? Math.round((counts.active / counts.all) * 100) : 0}% del total</span></div>
        <div className="ad-kpi ad-rise" style={{ animationDelay: '120ms' }}><span className="ad-kpi-icon"><Icon name="mobile" /></span><small>La tienen instalada</small><strong>{counts.installed}</strong></div>
        <div className="ad-kpi ad-rise" style={{ animationDelay: '180ms' }}><span className="ad-kpi-icon"><Icon name="history" /></span><small>Activos esta semana</small><strong>{week}</strong></div>
      </div>
      <p className="ad-note" style={{ background: '#f3efe7' }}>Cada cliente recibe por email un <strong>código personal</strong> al comprar. Tiene <strong>30 días</strong> para activarlo; una vez activado, el acceso es ilimitado. «Instalada» significa que la ha abierto desde el icono de su pantalla de inicio.</p>
      <div className="ad-toolbar ad-rise">
        <div className="ad-search"><Icon name="search" /><input type="search" placeholder="Buscar por nombre, email, código o pedido" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" /></div>
        <button className="ad-btn primary" onClick={() => setAdding(true)}><Icon name="plus" />Dar acceso</button>
        <button className="ad-btn" disabled={!list.length} onClick={() => downloadCSV('app-glowfit-clientes.csv', [['Nombre', 'Email', 'Código', 'Estado', 'Instalada', 'Dispositivo', 'Última visita', 'Visitas'], ...list.map((m) => [m.name || '', m.email, m.code, status(m).l, m.installed_at ? 'Sí' : 'No', m.platform || '', m.last_seen_at ? when(m.last_seen_at) : '', m.visits])])}><Icon name="download" />Exportar</button>
      </div>
      <div className="ad-chips ad-rise" role="tablist">
        {([['all', 'Todos'], ['pending', 'Sin activar'], ['active', 'Han entrado'], ['installed', 'Instalada'], ['notinstalled', 'Entraron sin instalar']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{l} <em>{counts[k]}</em></button>
        ))}
      </div>
      {list.length === 0 ? <div className="ad-card"><Empty icon="mobile" title={all.length ? 'Nadie coincide' : 'Aún no hay clientes en la app'} text={all.length ? 'Prueba con otro filtro o búsqueda.' : 'Cada cliente que compre recibirá su código automáticamente y aparecerá aquí. También puedes dar acceso a mano.'} /></div> : (
        <div className="ad-card flush ad-rise">
          <table className="ad-table">
            <thead><tr><th>Cliente</th><th>Código</th><th>Estado</th><th>Instalada</th><th>Última visita</th><th>Hábitos (7 días)</th></tr></thead>
            <tbody>{list.map((m) => { const s = status(m); return (
              <tr key={m.id} onClick={() => setOpen(m)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpen(m)}>
                <td data-l="Cliente"><span className="ad-who"><span className="ad-avatar soft">{(m.name || m.email).charAt(0).toUpperCase()}</span><span><strong>{m.name || '—'}</strong><br /><small className="ad-muted">{m.email}</small></span></span></td>
                <td data-l="Código"><code>{m.code}</code></td>
                <td data-l="Estado"><span className={`ad-badge f-${s.k}`}><i />{s.l}</span></td>
                <td data-l="Instalada">{m.installed_at ? <span className="ad-badge f-entregado"><i />Sí{m.platform ? ` · ${m.platform}` : ''}</span> : <span className="ad-badge f-cancelado"><i />No</span>}</td>
                <td data-l="Última visita">{m.last_seen_at ? ago(m.last_seen_at) : <span className="ad-muted">Nunca</span>}</td>
                <td data-l="Hábitos (7 días)">{m.checks_7d}</td>
              </tr>); })}</tbody>
          </table>
        </div>
      )}
      {open && <MemberModal m={open} onClose={() => setOpen(null)} reload={async () => { await load(); }} />}
      {adding && <AddModal onClose={() => setAdding(false)} done={() => { setAdding(false); load(); }} />}
    </>
  );
}

function MemberModal({ m, onClose, reload }: { m: Member; onClose: () => void; reload: () => Promise<void> }) {
  const toast = useToast();
  const [busy, setBusy] = useState('');
  const [cur, setCur] = useState(m);
  const s = status(cur);
  async function patch(row: Partial<Member>, ok: string) {
    setBusy('patch');
    const { error } = await sb().from('app_members').update(row).eq('id', cur.id);
    setBusy('');
    if (error) return toast('No se pudo guardar', 'err');
    setCur({ ...cur, ...row }); toast(ok); reload();
  }
  async function resend() {
    setBusy('mail');
    const r = await adminFetch<{ emailed: boolean }>('/api/app/admin/', { method: 'POST', body: { email: cur.email, name: cur.name, resend: true, guide: false } });
    setBusy('');
    if (!r.ok) return toast(r.data.error || 'No se pudo enviar', 'err');
    toast(r.data.emailed ? `Código enviado a ${cur.email}` : 'No se pudo enviar el email (revisa la configuración de correo)', r.data.emailed ? 'ok' : 'err');
    reload();
  }
  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); toast('Copiado'); } catch { toast('No se pudo copiar', 'err'); } };
  const expired = !cur.activated_at && new Date(cur.code_expires_at) < new Date();
  return (
    <Modal title={cur.name || cur.email} onClose={onClose}>
      <p className="ad-muted" style={{ marginTop: -6 }}>{cur.email}{cur.order_number ? ` · pedido #${cur.order_number}` : cur.source === 'manual' ? ' · acceso dado a mano' : ''}</p>
      <div className="ad-card" style={{ background: '#f8f4ec', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '12px 0' }}>
        <div><small className="ad-muted">Código personal</small><br /><code style={{ fontSize: '1.2rem', letterSpacing: 2 }}>{cur.code}</code></div>
        <button className="ad-btn sm" onClick={() => copy(cur.code)}><Icon name="copy" size={16} />Copiar</button>
      </div>
      <dl className="ad-dl" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px', margin: '0 0 12px' }}>
        <dt className="ad-muted">Estado</dt><dd style={{ margin: 0 }}><span className={`ad-badge f-${s.k}`}><i />{s.l}</span></dd>
        <dt className="ad-muted">Email enviado</dt><dd style={{ margin: 0 }}>{cur.code_emailed_at ? when(cur.code_emailed_at) : 'No'}</dd>
        {!cur.activated_at && <><dt className="ad-muted">Caduca</dt><dd style={{ margin: 0 }}>{when(cur.code_expires_at)}</dd></>}
        <dt className="ad-muted">Activado</dt><dd style={{ margin: 0 }}>{cur.activated_at ? when(cur.activated_at) : 'Todavía no'}</dd>
        <dt className="ad-muted">Instalada</dt><dd style={{ margin: 0 }}>{cur.installed_at ? `Sí, desde ${when(cur.installed_at)}${cur.platform ? ` (${cur.platform})` : ''}` : 'No'}</dd>
        <dt className="ad-muted">Última visita</dt><dd style={{ margin: 0 }}>{cur.last_seen_at ? `${when(cur.last_seen_at)} · ${cur.visits} ${cur.visits === 1 ? 'visita' : 'visitas'}` : 'Nunca'}</dd>
        <dt className="ad-muted">Hábitos marcados</dt><dd style={{ margin: 0 }}>{cur.checks_7d} en los últimos 7 días</dd>
      </dl>
      <div className="ad-fu-pause" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--ad-line)' }}><span><strong>Acceso a la guía PDF</strong><br /><small className="ad-muted">Quien compra un producto o la guía la tiene</small></span><Switch on={cur.has_guide} onChange={(v) => patch({ has_guide: v }, v ? 'Guía activada' : 'Guía desactivada')} label="Acceso a la guía" /></div>
      <div className="ad-fu-pause" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--ad-line)' }}><span><strong>Acceso a la app</strong><br /><small className="ad-muted">{cur.revoked ? 'Bloqueado: no puede entrar' : 'Puede entrar con su código'}</small></span><Switch on={!cur.revoked} onChange={(v) => patch({ revoked: !v }, v ? 'Acceso activado' : 'Acceso bloqueado')} label="Acceso a la app" /></div>
      <div className="ad-modal-actions">
        {expired && <button className="ad-btn" disabled={!!busy} onClick={() => patch({ code_expires_at: new Date(Date.now() + 30 * 864e5).toISOString() }, 'Plazo ampliado 30 días')}><Icon name="refresh" />Dar 30 días más</button>}
        <button className="ad-btn primary" disabled={!!busy || cur.revoked} onClick={resend}>{busy === 'mail' ? <span className="ad-spinner sm" /> : <Icon name="mail" />}{cur.code_emailed_at ? 'Reenviar código por email' : 'Enviar código por email'}</button>
      </div>
    </Modal>
  );
}

function AddModal({ onClose, done }: { onClose: () => void; done: () => void }) {
  const toast = useToast();
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [guide, setGuide] = useState(true);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErr('Escribe un email válido');
    setBusy(true);
    const r = await adminFetch<{ emailed: boolean; code: string }>('/api/app/admin/', { method: 'POST', body: { email, name, guide } });
    setBusy(false);
    if (!r.ok) return setErr(r.data.error || 'No se pudo dar el acceso');
    toast(r.data.emailed ? `Acceso enviado a ${email}` : `Acceso creado (código ${r.data.code}), pero no se pudo enviar el email`, r.data.emailed ? 'ok' : 'err');
    done();
  }
  return (
    <Modal title="Dar acceso a la app" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <p className="ad-muted" style={{ marginTop: -6 }}>Le llegará un email con su código personal y cómo instalar la app. Útil para regalos, colaboraciones o clientes que compraron por otra vía.</p>
        <label className="ad-field"><span>Email</span><input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }} onBlur={() => email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && setErr('Escribe un email válido')} required data-autofocus aria-invalid={!!err} />{err && <em className="ad-err">{err}</em>}</label>
        <label className="ad-field"><span>Nombre <small>(opcional)</small></span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="ad-check"><input type="checkbox" checked={guide} onChange={(e) => setGuide(e.target.checked)} />Incluir la guía PDF</label>
        <div className="ad-modal-actions">
          <button type="button" className="ad-btn" onClick={onClose}>Cancelar</button>
          <button className="ad-btn primary" disabled={busy}>{busy ? <span className="ad-spinner sm" /> : <Icon name="mail" />}Dar acceso y enviar código</button>
        </div>
      </form>
    </Modal>
  );
}

function Checklist() {
  const toast = useToast();
  const [rows, setRows] = useState<Item[] | null>(null);
  const [text, setText] = useState('');
  const load = useCallback(async () => { const { data } = await sb().from('app_checklist').select('*').order('sort'); setRows((data as Item[]) ?? []); }, []);
  useEffect(() => { load(); }, [load]);
  async function add(e: React.FormEvent) {
    e.preventDefault(); if (!text.trim()) return;
    const { error } = await sb().from('app_checklist').insert({ text: text.trim().slice(0, 140), sort: (rows?.reduce((m, r) => Math.max(m, r.sort), 0) ?? 0) + 1 });
    if (error) return toast('No se pudo añadir', 'err');
    setText(''); load();
  }
  async function update(id: string, row: Partial<Item>) { const { error } = await sb().from('app_checklist').update(row).eq('id', id); if (error) toast('No se pudo guardar', 'err'); load(); }
  async function remove(id: string) { const { error } = await sb().from('app_checklist').delete().eq('id', id); if (error) toast('No se pudo borrar', 'err'); else toast('Hábito borrado'); load(); }
  async function move(i: number, d: -1 | 1) {
    if (!rows) return; const a = [...rows]; const j = i + d; if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; setRows(a);
    await Promise.all(a.map((r, k) => sb().from('app_checklist').update({ sort: k + 1 }).eq('id', r.id)));
  }
  if (!rows) return <Skeleton rows={5} />;
  return (
    <>
      <p className="ad-note" style={{ background: '#f3efe7' }}>Estos son los hábitos que cada cliente marca cada día en su app. Se reinician solos cada mañana. Escríbelos como acciones sencillas, sin prometer resultados de salud.</p>
      <form className="ad-toolbar ad-rise" onSubmit={add}>
        <div className="ad-search" style={{ flex: 1 }}><Icon name="plus" /><input value={text} onChange={(e) => setText(e.target.value)} maxLength={140} placeholder="Nuevo hábito, por ejemplo: Beber un vaso de agua al despertar" aria-label="Nuevo hábito" /></div>
        <button className="ad-btn primary" disabled={!text.trim()}><Icon name="plus" />Añadir hábito</button>
      </form>
      {rows.length === 0 ? <div className="ad-card"><Empty icon="check" title="Sin hábitos" text="Añade el primero arriba." /></div> : (
        <div className="ad-card ad-rise" style={{ padding: 8 }}>
          {rows.map((r, i) => <ChecklistRow key={r.id} r={r} first={i === 0} last={i === rows.length - 1} onMove={(d) => move(i, d)} onSave={(row) => update(r.id, row)} onDelete={() => remove(r.id)} />)}
        </div>
      )}
    </>
  );
}

function ChecklistRow({ r, first, last, onMove, onSave, onDelete }: { r: Item; first: boolean; last: boolean; onMove: (d: -1 | 1) => void; onSave: (row: Partial<Item>) => void; onDelete: () => void }) {
  const [t, setT] = useState(r.text);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => setT(r.text), [r.text]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', borderBottom: last ? 0 : '1px solid var(--ad-line)', opacity: r.active ? 1 : 0.55 }}>
      <span style={{ display: 'flex', flexDirection: 'column' }}>
        <button className="ad-icon-btn" disabled={first} onClick={() => onMove(-1)} aria-label="Subir"><Icon name="up" size={16} /></button>
        <button className="ad-icon-btn" disabled={last} onClick={() => onMove(1)} aria-label="Bajar"><Icon name="down" size={16} /></button>
      </span>
      <input value={t} maxLength={140} onChange={(e) => setT(e.target.value)} onBlur={() => t.trim() && t !== r.text && onSave({ text: t.trim() })} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} aria-label="Texto del hábito" style={{ flex: 1, minWidth: 0, border: '1px solid transparent', borderRadius: 10, padding: '10px 10px', font: 'inherit', background: 'transparent' }} onFocus={(e) => (e.target.style.borderColor = 'var(--ad-line)')} />
      <Switch on={r.active} onChange={(v) => onSave({ active: v })} label={r.active ? 'Visible' : 'Oculto'} />
      {confirm
        ? <><button className="ad-btn sm danger" onClick={onDelete}>Borrar «{r.text.slice(0, 18)}{r.text.length > 18 ? '…' : ''}»</button><button className="ad-btn sm" onClick={() => setConfirm(false)}>No</button></>
        : <button className="ad-icon-btn" onClick={() => setConfirm(true)} aria-label="Borrar hábito"><Icon name="trash" size={16} /></button>}
    </div>
  );
}

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);

function Contents() {
  const toast = useToast();
  const [rows, setRows] = useState<Content[] | null>(null);
  const [kind, setKind] = useState<'all' | Content['kind']>('all');
  const [edit, setEdit] = useState<Content | null>(null);
  const load = useCallback(async () => { const { data } = await sb().from('app_content').select('*').order('sort').order('created_at', { ascending: false }); setRows((data as Content[]) ?? []); }, []);
  useEffect(() => { load(); }, [load]);
  const list = useMemo(() => (rows ?? []).filter((r) => kind === 'all' || r.kind === kind), [rows, kind]);
  async function move(id: string, d: -1 | 1) {
    if (!rows) return; const a = [...rows]; const i = a.findIndex((r) => r.id === id); const j = i + d; if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; setRows(a);
    const res = await Promise.all(a.map((r, k) => sb().from('app_content').update({ sort: k + 1 }).eq('id', r.id)));
    if (res.some((x) => x.error)) toast('No se pudo ordenar', 'err');
  }
  if (!rows) return <Skeleton rows={5} />;
  const blank: Content = { id: '', kind: 'receta', title: '', summary: '', body: '', image_url: null, sort: 0, active: true };
  return (
    <>
      <p className="ad-note" style={{ background: '#f3efe7' }}>Lo que publiques aquí aparece en el carrusel «Ideas para tu día» de la app. Recuerda: sin prometer efectos sobre la salud ni la pérdida de peso (normativa de complementos alimenticios).</p>
      <div className="ad-toolbar ad-rise" style={{ justifyContent: 'space-between' }}>
        <div className="ad-chips" role="tablist" style={{ margin: 0 }}>
          {([['all', 'Todo'], ['receta', 'Recetas'], ['entrenamiento', 'Entrenamientos'], ['tip', 'Tips']] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? 'active' : ''} onClick={() => setKind(k)}>{l} <em>{k === 'all' ? rows.length : rows.filter((r) => r.kind === k).length}</em></button>
          ))}
        </div>
        <button className="ad-btn primary" onClick={() => setEdit({ ...blank, kind: kind === 'all' ? 'receta' : kind })}><Icon name="plus" />Nuevo contenido</button>
      </div>
      {list.length === 0 ? <div className="ad-card"><Empty icon="image" title="Nada por aquí" text="Crea tu primera receta, entrenamiento o tip." /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
          {list.map((c) => (
            <div key={c.id} className="ad-card ad-rise" style={{ padding: 0, overflow: 'hidden', opacity: c.active ? 1 : 0.55, display: 'flex', flexDirection: 'column' }}>
              <button onClick={() => setEdit(c)} style={{ border: 0, padding: 0, background: 'none', textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', flex: 1 }}>
                <div style={{ aspectRatio: '4/3', background: c.image_url ? `center/cover url(${JSON.stringify(c.image_url)})` : '#f3efe7', display: 'grid', placeItems: 'center', fontSize: 34 }}>{!c.image_url && (c.kind === 'receta' ? '🥗' : c.kind === 'entrenamiento' ? '🧘‍♀️' : '🌿')}</div>
                <div style={{ padding: '12px 14px' }}>
                  <small className="ad-muted" style={{ textTransform: 'uppercase', letterSpacing: '.1em', fontSize: '.7rem' }}>{KINDS.find((k) => k.v === c.kind)?.l}{!c.active && ' · oculto'}</small>
                  <h3 style={{ fontSize: '1.1rem', margin: '2px 0 4px' }}>{c.title}</h3>
                  {c.summary && <p className="ad-muted sm" style={{ margin: 0 }}>{c.summary}</p>}
                </div>
              </button>
              <div style={{ display: 'flex', gap: 4, padding: '0 8px 8px' }}>
                <button className="ad-icon-btn" onClick={() => move(c.id, -1)} aria-label="Mover antes"><Icon name="left" size={16} /></button>
                <button className="ad-icon-btn" onClick={() => move(c.id, 1)} aria-label="Mover después"><Icon name="right" size={16} /></button>
                <button className="ad-btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => setEdit(c)}><Icon name="edit" size={16} />Editar</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {edit && <ContentModal c={edit} nextSort={(rows.reduce((m, r) => Math.max(m, r.sort), 0) ?? 0) + 1} onClose={() => setEdit(null)} done={() => { setEdit(null); load(); }} />}
    </>
  );
}

function ContentModal({ c, nextSort, onClose, done }: { c: Content; nextSort: number; onClose: () => void; done: () => void }) {
  const toast = useToast();
  const [p, setP] = useState<Content>({ ...c, summary: c.summary ?? '', body: c.body ?? '' });
  const [busy, setBusy] = useState(false); const [up, setUp] = useState(false); const [err, setErr] = useState('');
  const [confirm, setConfirm] = useState(false);
  const set = <K extends keyof Content>(k: K, v: Content[K]) => setP((x) => ({ ...x, [k]: v }));
  async function upload(f?: File) {
    if (!f || !f.type.startsWith('image/')) return;
    if (f.size > 8 * 1024 * 1024) return toast('La foto pesa más de 8 MB', 'err');
    setUp(true);
    const now = new Date(); const ext = f.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `uploads/app/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${Date.now()}-${slugify(f.name.replace(/\.[^.]+$/, '')) || 'foto'}.${ext}`;
    const { error } = await sb().storage.from('media').upload(path, f, { contentType: f.type });
    setUp(false);
    if (error) return toast('No se pudo subir la foto', 'err');
    set('image_url', sb().storage.from('media').getPublicUrl(path).data.publicUrl);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!p.title.trim()) return setErr('Escribe un título');
    setBusy(true);
    const row = { kind: p.kind, title: p.title.trim(), summary: p.summary?.trim() || null, body: p.body?.trim() || null, image_url: p.image_url, active: p.active };
    const { error } = p.id ? await sb().from('app_content').update(row).eq('id', p.id) : await sb().from('app_content').insert({ ...row, sort: nextSort });
    setBusy(false);
    if (error) return toast('No se pudo guardar', 'err');
    toast(p.id ? 'Guardado' : 'Publicado en la app'); done();
  }
  async function remove() {
    const { error } = await sb().from('app_content').delete().eq('id', p.id);
    if (error) return toast('No se pudo borrar', 'err');
    toast('Borrado'); done();
  }
  return (
    <Modal title={p.id ? 'Editar contenido' : 'Nuevo contenido'} onClose={onClose} wide>
      <form onSubmit={save} noValidate>
        <label className="ad-field"><span>Tipo</span><select value={p.kind} onChange={(e) => set('kind', e.target.value as Content['kind'])}>{KINDS.map((k) => <option key={k.v} value={k.v}>{k.l}</option>)}</select></label>
        <label className="ad-field"><span>Título</span><input value={p.title} maxLength={90} onChange={(e) => { set('title', e.target.value); setErr(''); }} onBlur={() => !p.title.trim() && setErr('Escribe un título')} aria-invalid={!!err} placeholder="Ej. Crema de calabaza" data-autofocus />{err && <em className="ad-err">{err}</em>}</label>
        <label className="ad-field"><span>Frase corta <small>(se ve en la tarjeta)</small></span><input value={p.summary ?? ''} maxLength={90} onChange={(e) => set('summary', e.target.value)} placeholder="Ej. Lista en 20 minutos" /></label>
        <label className="ad-field"><span>Texto completo <small>(ingredientes, pasos… deja una línea en blanco entre párrafos)</small></span><textarea rows={9} value={p.body ?? ''} onChange={(e) => set('body', e.target.value)} /></label>
        <div className="ad-field"><span>Foto <small>(opcional)</small></span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {p.image_url && <img src={p.image_url} alt="" style={{ width: 120, aspectRatio: '4/3', objectFit: 'cover', borderRadius: 12 }} />}
            <label className="ad-btn sm">{up ? <span className="ad-spinner sm" /> : <Icon name="image" size={16} />}{p.image_url ? 'Cambiar foto' : 'Subir foto'}<input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} /></label>
            {p.image_url && <button type="button" className="ad-btn sm ghost" onClick={() => set('image_url', null)}>Quitar foto</button>}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--ad-line)' }}><span><strong>Visible en la app</strong><br /><small className="ad-muted">Si lo desactivas, se guarda pero no se muestra</small></span><Switch on={p.active} onChange={(v) => set('active', v)} label="Visible en la app" /></div>
        <div className="ad-modal-actions" style={{ justifyContent: 'space-between' }}>
          <span>{p.id && (confirm ? <button type="button" className="ad-btn danger" onClick={remove}><Icon name="trash" />Borrar «{p.title.slice(0, 20)}»</button> : <button type="button" className="ad-btn ghost" onClick={() => setConfirm(true)}><Icon name="trash" />Borrar</button>)}</span>
          <span style={{ display: 'flex', gap: 10 }}><button type="button" className="ad-btn" onClick={onClose}>Cancelar</button><button className="ad-btn primary" disabled={busy || up}>{busy ? <span className="ad-spinner sm" /> : <Icon name="check" />}{p.id ? 'Guardar' : 'Publicar'}</button></span>
        </div>
      </form>
    </Modal>
  );
}
