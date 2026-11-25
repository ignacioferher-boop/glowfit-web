'use client';
import { useEffect, useState } from 'react';
import { sb } from '@/lib/supabase-browser';
import { Empty, Icon, Skeleton, useToast, when } from './ui';

type R = { id: string; order_number: number | null; name: string; rating: number; title: string | null; body: string | null; products: string[]; status: 'pending' | 'approved' | 'hidden'; reply: string | null; created_at: string };
const LABEL = { pending: 'Por revisar', approved: 'Publicada', hidden: 'Oculta' };
const CHIP = { pending: 'Por revisar', approved: 'Publicadas', hidden: 'Ocultas' };

export default function ReviewsAdmin() {
  const toast = useToast();
  const [rows, setRows] = useState<R[] | null>(null);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'hidden' | 'all'>('pending');
  const [replying, setReplying] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  async function load() {
    const { data, error } = await sb().from('reviews').select('*').order('created_at', { ascending: false }).limit(500);
    if (error) { setRows([]); return; }
    setRows(data as R[]);
  }
  useEffect(() => { load(); }, []);
  async function patch(id: string, p: Partial<R>, ok: string) {
    const { error } = await sb().from('reviews').update(p).eq('id', id);
    if (error) return toast('No se pudo guardar.', 'err');
    toast(ok); setReplying(null); await load();
    fetch('/api/revalidate/', { method: 'POST', headers: { authorization: `Bearer ${(await sb().auth.getSession()).data.session?.access_token ?? ''}` } }).catch(() => {});
  }
  if (!rows) return <Skeleton rows={4} />;
  const counts = { pending: rows.filter((r) => r.status === 'pending').length, approved: rows.filter((r) => r.status === 'approved').length, hidden: rows.filter((r) => r.status === 'hidden').length, all: rows.length };
  const list = rows.filter((r) => filter === 'all' || r.status === filter);
  const avg = counts.approved ? (rows.filter((r) => r.status === 'approved').reduce((n, r) => n + r.rating, 0) / counts.approved).toFixed(1).replace('.', ',') : '–';
  return (
    <>
      <div className="ad-kpis three">
        <div className="ad-kpi ad-rise"><span className="ad-kpi-icon"><Icon name="star" /></span><small>Nota media publicada</small><strong>{avg}</strong></div>
        <div className="ad-kpi ad-rise" style={{ animationDelay: '60ms' }}><span className="ad-kpi-icon"><Icon name="alert" /></span><small>Por revisar</small><strong>{counts.pending}</strong></div>
        <div className="ad-kpi ad-rise" style={{ animationDelay: '120ms' }}><span className="ad-kpi-icon"><Icon name="check" /></span><small>Publicadas</small><strong>{counts.approved}</strong></div>
      </div>
      <div className="ad-chips ad-rise" role="tablist">
        {(['pending', 'approved', 'hidden', 'all'] as const).map((k) => <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{k === 'all' ? 'Todas' : CHIP[k]} <em>{counts[k]}</em></button>)}
      </div>
      {list.length === 0 ? <div className="ad-card"><Empty icon="star" title={rows.length ? 'Nada por aquí' : 'Aún no hay opiniones'} text="A los 7 días de marcar un pedido como entregado, el cliente recibe un email para valorar su compra. Las opiniones llegan aquí y tú decides cuáles publicar." /></div> : (
        <div className="ad-list">
          {list.map((r) => (
            <div key={r.id} className="ad-card ad-review ad-rise">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <span><span className="ad-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span> <strong>{r.name}</strong> <span className="ad-muted sm">· pedido #{r.order_number} · {when(r.created_at)}</span></span>
                <span className={`ad-badge ${r.status === 'approved' ? 'f-entregado' : r.status === 'hidden' ? 'f-cancelado' : 'f-nuevo'}`}><i />{LABEL[r.status]}</span>
              </div>
              {r.title && <strong>{r.title}</strong>}
              {r.body ? <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{r.body}</p> : <p className="ad-muted sm" style={{ margin: 0 }}>Solo ha puesto estrellas.</p>}
              {r.reply && replying !== r.id && <p className="ad-note">Tu respuesta: {r.reply}</p>}
              {replying === r.id && <label className="ad-field"><span>Respuesta pública de Glowfit</span><textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} maxLength={1000} /></label>}
              <div className="ad-review-actions">
                {r.status !== 'approved' && <button className="ad-btn sm primary" onClick={() => patch(r.id, { status: 'approved' }, 'Opinión publicada en la web')}><Icon name="check" />Publicar</button>}
                {r.status !== 'hidden' && <button className="ad-btn sm" onClick={() => patch(r.id, { status: 'hidden' }, 'Opinión ocultada')}><Icon name="eyeoff" />Ocultar</button>}
                {replying === r.id
                  ? <><button className="ad-btn sm primary" onClick={() => patch(r.id, { reply: reply.trim() || null }, 'Respuesta guardada')}>Guardar respuesta</button><button className="ad-btn sm" onClick={() => setReplying(null)}>Cancelar</button></>
                  : <button className="ad-btn sm" onClick={() => { setReplying(r.id); setReply(r.reply ?? ''); }}><Icon name="mail" />{r.reply ? 'Editar respuesta' : 'Responder'}</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
