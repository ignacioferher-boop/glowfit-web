'use client';
import { useCallback, useEffect, useState } from 'react';
import { sb } from '@/lib/supabase-browser';
import { adminFetch } from '@/lib/admin-fetch';
import { Drawer, Empty, Icon, Skeleton, Switch, useToast, when } from './ui';

type M = { id: string; author: 'auto' | 'cliente' | 'glowfit'; step: number | null; subject: string | null; body: string; emailed: boolean; read_at: string | null; created_at: string };
type F = { id: string; order_number: number; created_at: string; name: string; email: string; phone: string | null; items: { name: string; qty: number }[] | null; fulfillment: string; paused: boolean; messages: M[] };

// Mismo calendario que el envío automático (lib/followup.ts)
const STEPS = [{ step: 1, day: 5, l: '¿Te ha llegado?' }, { step: 2, day: 15, l: '¿Notas algún cambio?' }, { step: 3, day: 28, l: 'Tu opinión al mes' }];
const DAY = 86400000;
const dateShort = (d: Date) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' });
const unread = (f: F) => f.messages.filter((m) => m.author === 'cliente' && !m.read_at).length;
const sentSteps = (f: F) => f.messages.filter((m) => m.author === 'auto' && m.emailed).length;
const done = (f: F) => f.fulfillment === 'cancelado' || f.paused || sentSteps(f) >= 3;
const wa = (p?: string | null) => { const d = String(p ?? '').replace(/\D/g, ''); return d.length >= 9 ? `https://wa.me/${d.length === 9 ? `34${d}` : d}` : ''; };

function stepState(f: F, s: (typeof STEPS)[number]) {
  const m = f.messages.find((x) => x.author === 'auto' && x.step === s.step && x.emailed);
  if (m) return { cls: 'sent', text: `Enviado ${dateShort(new Date(m.created_at))}` };
  if (f.fulfillment === 'cancelado') return { cls: 'off', text: 'Pedido cancelado' };
  if (f.paused) return { cls: 'off', text: 'Pausado' };
  const due = new Date(Math.max(new Date(f.created_at).getTime() + s.day * DAY, Date.now()));
  if (!['enviado', 'entregado'].includes(f.fulfillment)) return { cls: 'wait', text: 'Cuando salga el pedido' };
  return { cls: 'next', text: due.getTime() - Date.now() < DAY ? 'Mañana' : `Hacia el ${dateShort(due)}` };
}

export default function FollowupsAdmin() {
  const toast = useToast();
  const [rows, setRows] = useState<F[] | null>(null);
  const [filter, setFilter] = useState<'reply' | 'active' | 'done' | 'all'>('reply');
  const [open, setOpen] = useState<string | null>(null);
  const load = useCallback(async () => {
    const { data, error } = await sb().rpc('admin_followups');
    if (error) { console.error(error.message); setRows([]); return; }
    setRows((data as F[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (rows && filter === 'reply' && !rows.some((f) => unread(f) > 0)) setFilter('active');
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!rows) return <Skeleton rows={4} />;
  const counts = { reply: rows.filter((f) => unread(f) > 0).length, active: rows.filter((f) => !done(f)).length, done: rows.filter(done).length, all: rows.length };
  const list = rows.filter((f) => filter === 'all' || (filter === 'reply' ? unread(f) > 0 : filter === 'active' ? !done(f) : done(f)));
  const sent30 = rows.reduce((n, f) => n + f.messages.filter((m) => m.author === 'auto' && m.emailed && Date.now() - new Date(m.created_at).getTime() < 30 * DAY).length, 0);
  const answered = rows.filter((f) => f.messages.some((m) => m.author === 'cliente')).length;
  const current = rows.find((f) => f.id === open) ?? null;
  return (
    <>
      <div className="ad-kpis three">
        <div className="ad-kpi ad-rise"><span className="ad-kpi-icon"><Icon name="alert" /></span><small>Por contestar</small><strong>{counts.reply}</strong></div>
        <div className="ad-kpi ad-rise" style={{ animationDelay: '60ms' }}><span className="ad-kpi-icon"><Icon name="mail" /></span><small>Mensajes enviados (30 días)</small><strong>{sent30}</strong></div>
        <div className="ad-kpi ad-rise" style={{ animationDelay: '120ms' }}><span className="ad-kpi-icon"><Icon name="users" /></span><small>Clientes que han contestado</small><strong>{answered}</strong></div>
      </div>
      <p className="ad-note" style={{ background: '#f3efe7' }}>Cada cliente recibe 3 mensajes automáticos: a los <strong>5</strong>, <strong>15</strong> y <strong>28 días</strong> de su compra (solo si el pedido ya ha salido). Cuando contestan, te llega un email y aparece aquí para que le respondas.</p>
      <div className="ad-chips ad-rise" role="tablist">
        {([['reply', 'Por contestar'], ['active', 'En curso'], ['done', 'Terminados'], ['all', 'Todos']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{l} <em>{counts[k]}</em></button>
        ))}
      </div>
      {list.length === 0 ? <div className="ad-card"><Empty icon="mail" title={rows.length ? 'Nada por aquí' : 'Aún no hay pedidos'} text={filter === 'reply' ? 'Cuando un cliente conteste a un mensaje de seguimiento, aparecerá aquí.' : 'Los seguimientos empiezan solos cuando hay pedidos pagados.'} /></div> : (
        <div className="ad-list">
          {list.map((f) => {
            const u = unread(f);
            const last = [...f.messages].reverse().find((m) => m.author !== 'auto');
            return (
              <button key={f.id} className="ad-card ad-fu-card ad-rise" onClick={() => setOpen(f.id)}>
                <div className="ad-fu-head">
                  <span><strong>{f.name || f.email}</strong> <span className="ad-muted sm">· pedido #{f.order_number} · {when(f.created_at)}</span></span>
                  {u > 0 && <span className="ad-badge f-nuevo"><i />{u === 1 ? '1 mensaje nuevo' : `${u} mensajes nuevos`}</span>}
                </div>
                <div className="ad-fu-steps">
                  {STEPS.map((s) => { const st = stepState(f, s); return <span key={s.step} className={`ad-fu-step ${st.cls}`}><b>Día {s.day}</b>{st.text}</span>; })}
                </div>
                {last && <p className="ad-muted sm ad-fu-last">{last.author === 'cliente' ? 'Cliente' : 'Tú'}: {last.body}</p>}
              </button>
            );
          })}
        </div>
      )}
      {current && <Thread f={current} onClose={() => setOpen(null)} reload={load} toast={toast} />}
    </>
  );
}

function Thread({ f, onClose, reload, toast }: { f: F; onClose: () => void; reload: () => Promise<void>; toast: ReturnType<typeof useToast> }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (unread(f) > 0) sb().rpc('admin_followup_mark_read', { p_order: f.id }).then(() => reload());
  }, [f.id]); // eslint-disable-line react-hooks/exhaustive-deps
  async function send() {
    if (text.trim().length < 2) return toast('Escribe tu respuesta.', 'err');
    setBusy(true);
    const { ok, data } = await adminFetch<{ emailed?: boolean }>('/api/followup/admin/', { method: 'POST', body: { id: f.id, body: text } });
    setBusy(false);
    if (!ok) return toast(data.error || 'No se pudo enviar.', 'err');
    toast(data.emailed ? 'Respuesta enviada por email' : 'Guardada, pero el email no salió. Revisa la configuración de emails.', data.emailed ? undefined : 'err');
    setText(''); await reload();
  }
  async function pause(v: boolean) {
    const { error } = await sb().rpc('admin_followup_pause', { p_order: f.id, p_paused: v });
    if (error) return toast('No se pudo guardar.', 'err');
    toast(v ? 'Seguimiento pausado: no recibirá más mensajes automáticos' : 'Seguimiento activado'); await reload();
  }
  const w = wa(f.phone);
  const shown = f.messages.filter((m) => m.author !== 'auto' || m.emailed);
  return (
    <Drawer title={f.name || f.email} sub={<>Pedido #{f.order_number} · {(f.items ?? []).map((i) => `${i.qty}× ${i.name}`).join(', ')}</>} onClose={onClose}
      footer={<div style={{ width: '100%' }}>
        <label className="ad-field"><span>Tu respuesta <small>· le llega por email y queda guardada aquí</small></span><textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={5000} placeholder={`Hola ${(f.name || '').split(' ')[0]}, …`} /></label>
        <button className="ad-btn primary full" disabled={busy} onClick={send}>{busy ? <span className="ad-spinner sm" /> : <><Icon name="mail" />Enviar respuesta</>}</button>
      </div>}>
      <div className="ad-fu-contact">
        <a className="ad-btn sm" href={`mailto:${f.email}`}><Icon name="mail" size={16} />{f.email}</a>
        {w && <a className="ad-btn sm" href={w} target="_blank" rel="noopener"><Icon name="phone" size={16} />WhatsApp</a>}
      </div>
      <div className="ad-fu-pause"><span><strong>Mensajes automáticos</strong><br /><small className="ad-muted">{f.paused ? 'Pausados (por ti o porque el cliente lo pidió)' : `${sentSteps(f)} de 3 enviados`}</small></span><Switch on={!f.paused} onChange={(v) => pause(!v)} label="Mensajes automáticos" /></div>
      <ol className="ad-fu-thread">
        {shown.length === 0 && <li className="ad-muted sm">Todavía no se le ha enviado ningún mensaje. {STEPS.map((s) => `Día ${s.day}: ${stepState(f, s).text}`).join(' · ')}</li>}
        {shown.map((m) => (
          <li key={m.id} className={m.author === 'cliente' ? 'them' : 'me'}>
            <span className="ad-fu-who">{m.author === 'cliente' ? f.name.split(' ')[0] || 'Cliente' : m.author === 'auto' ? `Automático · día ${STEPS.find((s) => s.step === m.step)?.day}` : 'Glowfit'} · {when(m.created_at)}{m.author === 'glowfit' && !m.emailed ? ' · email no enviado' : ''}</span>
            <div className="ad-fu-bubble">{m.author === 'auto' && m.subject ? <strong>{m.subject}{'\n\n'}</strong> : null}{m.body}</div>
          </li>
        ))}
      </ol>
      <p className="ad-muted sm">Si el cliente contesta directamente al email, su respuesta llega a vuestro correo de pedidos, no aquí.</p>
    </Drawer>
  );
}
