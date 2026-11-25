'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-fetch';
import { Empty, Icon, Modal, Skeleton, eur, useToast } from './ui';

type Promo = { id: string; code: string; active: boolean; percent: number | null; amount_cents: number | null; times_redeemed: number; max_redemptions: number | null; expires_at: number | null; first_time: boolean; min_cents: number | null; created: number };
const fecha = (t: number) => new Date(t * 1000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

export default function Promos() {
  const toast = useToast();
  const [list, setList] = useState<Promo[] | null>(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  async function load() {
    const { ok, data } = await adminFetch<{ promos: Promo[] }>('/api/admin/promos/');
    if (!ok) { setErr(data.error || 'No se pudieron cargar los códigos.'); setList([]); return; }
    setErr(''); setList(data.promos);
  }
  useEffect(() => { load(); }, []);
  async function toggle(p: Promo) {
    const { ok, data } = await adminFetch('/api/admin/promos/', { method: 'PATCH', body: { id: p.id, active: !p.active } });
    if (!ok) return toast(data.error || 'No se pudo cambiar.', 'err');
    toast(p.active ? `${p.code} desactivado` : `${p.code} activado`); load();
  }
  if (!list) return <Skeleton rows={4} />;
  const expired = (p: Promo) => !!p.expires_at && p.expires_at * 1000 < Date.now();
  return (
    <>
      <div className="ad-toolbar ad-rise">
        <p className="ad-muted" style={{ margin: 0, flex: 1 }}>Los clientes escriben el código en la página de pago y el descuento se aplica solo.</p>
        <button className="ad-btn primary" onClick={() => setOpen(true)} disabled={!!err}><Icon name="plus" />Nuevo código</button>
      </div>
      {err ? <div className="ad-card"><Empty icon="ticket" title="Descuentos aún no disponibles" text={err} /></div>
        : list.length === 0 ? <div className="ad-card"><Empty icon="ticket" title="Aún no hay códigos" text="Crea tu primer código, por ejemplo BIENVENIDA10 para un 10% en la primera compra." action={<button className="ad-btn primary" onClick={() => setOpen(true)}><Icon name="plus" />Crear código</button>} /></div>
        : (
          <div className="ad-card flush ad-rise">
            <table className="ad-table static">
              <thead><tr><th>Código</th><th>Descuento</th><th>Condiciones</th><th>Usos</th><th>Estado</th><th /></tr></thead>
              <tbody>{list.map((p) => (
                <tr key={p.id}>
                  <td data-l="Código"><strong className="ad-code">{p.code}</strong></td>
                  <td data-l="Descuento">{p.percent ? `${p.percent}%` : eur(p.amount_cents)}</td>
                  <td data-l="Condiciones" className="ad-muted sm">{[p.first_time && 'Solo primera compra', p.min_cents && `Mínimo ${eur(p.min_cents)}`, p.expires_at && `Hasta el ${fecha(p.expires_at)}`].filter(Boolean).join(' · ') || 'Sin condiciones'}</td>
                  <td data-l="Usos">{p.times_redeemed}{p.max_redemptions ? ` / ${p.max_redemptions}` : ''}</td>
                  <td data-l="Estado"><span className={`ad-badge ${p.active && !expired(p) ? 'f-entregado' : 'f-cancelado'}`}><i />{expired(p) ? 'Caducado' : p.active ? 'Activo' : 'Pausado'}</span></td>
                  <td>{!expired(p) && <button className="ad-btn sm" onClick={() => toggle(p)}>{p.active ? 'Pausar' : 'Activar'}</button>}</td>
                </tr>))}</tbody>
            </table>
          </div>
        )}
      {open && <NewPromo onClose={() => setOpen(false)} done={() => { setOpen(false); load(); }} />}
    </>
  );
}

function NewPromo({ onClose, done }: { onClose: () => void; done: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ code: '', kind: 'percent', value: '10', expires: '', max: '', min: '', first_time: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    const { ok, data } = await adminFetch('/api/admin/promos/', { method: 'POST', body: { ...f, value: Number(f.value.replace(',', '.')), min: f.min ? Number(f.min.replace(',', '.')) : undefined } });
    setBusy(false);
    if (!ok) return setErr(data.error || 'No se pudo crear.');
    toast(`Código ${f.code.toUpperCase()} creado`); done();
  }
  return (
    <Modal title="Nuevo código de descuento" onClose={onClose}>
      <form onSubmit={submit}>
        <label className="ad-field"><span>Código</span><input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })} placeholder="BIENVENIDA10" maxLength={30} data-autofocus /></label>
        <div className="ad-row2">
          <label className="ad-field"><span>Tipo</span><select value={f.kind} onChange={set('kind')}><option value="percent">Porcentaje (%)</option><option value="amount">Importe fijo (€)</option></select></label>
          <label className="ad-field"><span>{f.kind === 'percent' ? 'Porcentaje' : 'Euros'}</span><input inputMode="decimal" value={f.value} onChange={set('value')} /></label>
        </div>
        <div className="ad-row2">
          <label className="ad-field"><span>Válido hasta (opcional)</span><input type="date" value={f.expires} onChange={set('expires')} /></label>
          <label className="ad-field"><span>Máximo de usos (opcional)</span><input inputMode="numeric" value={f.max} onChange={set('max')} placeholder="Sin límite" /></label>
        </div>
        <label className="ad-field"><span>Compra mínima en € (opcional)</span><input inputMode="decimal" value={f.min} onChange={set('min')} placeholder="Sin mínimo" /></label>
        <label className="ad-check"><input type="checkbox" checked={f.first_time} onChange={set('first_time')} />Solo para la primera compra de cada cliente</label>
        {err && <p className="ad-error" role="alert">{err}</p>}
        <div className="ad-modal-actions"><button type="button" className="ad-btn" onClick={onClose}>Cancelar</button><button className="ad-btn primary" disabled={busy || f.code.length < 3}>{busy ? <span className="ad-spinner sm" /> : <Icon name="check" />}Crear código</button></div>
      </form>
    </Modal>
  );
}
