'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { sb } from '@/lib/supabase-browser';
import { Empty, Icon, Modal, Skeleton, Switch, when, useToast } from './ui';

type P = { id: string; slug: string; name: string; images: string[]; stock: number | null; active: boolean };
type Comp = { pack_id: string; component_id: string; qty: number };
type Log = { id: number; product_id: string | null; delta: number; reason: string; order_number: number | null; created_at: string };
type Res = { id: string; items: { product_id: string; qty: number }[]; expires_at: string; status: string; created_at: string };
type Inv = { low_stock_threshold: number; reserve_minutes: number; show_exact: boolean; notify_low_stock: boolean };
const DEF: Inv = { low_stock_threshold: 5, reserve_minutes: 30, show_exact: true, notify_low_stock: true };

const REASONS = ['Recuento', 'Rotura o caducado', 'Muestra o regalo', 'Devolución de cliente', 'Otro'];

export default function Inventory() {
  const toast = useToast();
  const [prods, setProds] = useState<P[] | null>(null);
  const [comps, setComps] = useState<Comp[]>([]);
  const [reserved, setReserved] = useState<Record<string, number>>({});
  const [resList, setResList] = useState<Res[]>([]);
  const [log, setLog] = useState<Log[]>([]);
  const [inv, setInv] = useState<Inv>(DEF);
  const [savedInv, setSavedInv] = useState<Inv>(DEF);
  const [modal, setModal] = useState<{ p: P; mode: 'in' | 'set' } | null>(null);

  const load = useCallback(async () => {
    const [a, b, c, d, e, f] = await Promise.all([
      sb().from('products').select('id,slug,name,images,stock,active').order('sort'),
      sb().from('product_components').select('pack_id,component_id,qty'),
      sb().rpc('reserved_now'),
      sb().from('inventory_log').select('*').order('created_at', { ascending: false }).limit(80),
      sb().from('site_settings').select('value').eq('key', 'inventory').maybeSingle(),
      sb().from('stock_reservations').select('*').eq('status', 'active').gt('expires_at', new Date().toISOString()).order('expires_at'),
    ]);
    setProds((a.data as P[]) ?? []);
    setComps((b.data as Comp[]) ?? []);
    setReserved(Object.fromEntries(((c.data ?? []) as { product_id: string; qty: number }[]).map((r) => [r.product_id, r.qty])));
    setLog((d.data as Log[]) ?? []);
    const v = { ...DEF, ...((e.data?.value as Partial<Inv>) ?? {}) };
    setInv(v); setSavedInv(v);
    setResList((f.data as Res[]) ?? []);
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const packIds = useMemo(() => new Set(comps.map((c) => c.pack_id)), [comps]);
  const bases = useMemo(() => (prods ?? []).filter((p) => !packIds.has(p.id) && p.stock !== null), [prods, packIds]);
  const untracked = useMemo(() => (prods ?? []).filter((p) => !packIds.has(p.id) && p.stock === null && p.active), [prods, packIds]);
  const packs = useMemo(() => (prods ?? []).filter((p) => packIds.has(p.id)), [prods, packIds]);
  const byId = useMemo(() => new Map((prods ?? []).map((p) => [p.id, p])), [prods]);
  const free = (p: P) => (p.stock === null ? null : Math.max(0, p.stock - (reserved[p.id] ?? 0)));
  const tone = (n: number | null) => (n === null ? 'ok' : n <= 0 ? 'out' : n <= inv.low_stock_threshold ? 'low' : 'ok');

  if (!prods) return <Skeleton rows={6} h={72} />;

  const totalStock = bases.reduce((n, p) => n + Math.max(0, p.stock ?? 0), 0);
  const totalRes = Object.values(reserved).reduce((n, v) => n + v, 0);
  const lowCount = bases.filter((p) => tone(free(p)) === 'low').length;
  const outCount = bases.filter((p) => tone(free(p)) === 'out').length + packs.filter((p) => packAvail(p).n === 0).length;

  function packAvail(pack: P) {
    let n: number | null = null; let limit: P | null = null;
    for (const c of comps.filter((x) => x.pack_id === pack.id)) {
      const comp = byId.get(c.component_id); if (!comp) continue;
      const f = free(comp); if (f === null) continue;
      const k = Math.floor(f / c.qty);
      if (n === null || k < n) { n = k; limit = comp; }
    }
    return { n, limit };
  }

  async function saveInv() {
    const v: Inv = { ...inv, low_stock_threshold: Math.max(1, Math.min(50, Math.round(inv.low_stock_threshold) || 5)), reserve_minutes: Math.max(30, Math.min(1440, inv.reserve_minutes)) };
    const { error } = await sb().from('site_settings').upsert({ key: 'inventory', value: v });
    if (error) return toast('No se pudo guardar', 'err');
    setInv(v); setSavedInv(v); toast('Ajustes de inventario guardados. Se ven en la web en unos minutos.');
    fetch('/api/revalidate', { method: 'POST', headers: { authorization: `Bearer ${(await sb().auth.getSession()).data.session?.access_token ?? ''}` } }).catch(() => {});
  }
  const dirty = JSON.stringify(inv) !== JSON.stringify(savedInv);

  return (
    <div className="ad-inv">
      <div className="ad-kpis ad-rise">
        <div className="ad-kpi"><span className="ad-kpi-icon"><Icon name="stock" /></span><small>Botes en el almacén</small><strong>{totalStock}</strong></div>
        <div className="ad-kpi"><span className="ad-kpi-icon"><Icon name="lock" /></span><small>Reservados ahora</small><strong>{totalRes}</strong><small>Clientes pagando</small></div>
        <div className="ad-kpi"><span className="ad-kpi-icon warn"><Icon name="alert" /></span><small>Últimas unidades</small><strong>{lowCount}</strong></div>
        <div className="ad-kpi"><span className="ad-kpi-icon bad"><Icon name="x" /></span><small>Agotados</small><strong>{outCount}</strong></div>
      </div>

      <section className="ad-card ad-rise">
        <div className="ad-card-head"><h3><Icon name="stock" />Botes</h3><small className="ad-muted">Disponible = en almacén − reservado por clientes que están pagando</small></div>
        {bases.length === 0 ? <Empty icon="box" title="Ningún producto con stock" text="Activa «Controlar stock» en un producto para verlo aquí." /> : (
          <ul className="ad-inv-list">
            {bases.map((p) => {
              const f = free(p); const t = tone(f); const r = reserved[p.id] ?? 0;
              const max = Math.max(...bases.map((b) => b.stock ?? 0), inv.low_stock_threshold * 3, 1);
              return (
                <li key={p.id} className={`ad-inv-row ${t}`}>
                  <span className="ad-inv-img">{p.images?.[0] ? <img src={p.images[0]} alt="" /> : <Icon name="image" />}</span>
                  <div className="ad-inv-main">
                    <strong>{p.name}{!p.active && <span className="ad-tag inline">Oculto</span>}</strong>
                    <div className="ad-inv-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, ((p.stock ?? 0) / max) * 100)}%` }} /><b style={{ left: `${Math.min(100, (inv.low_stock_threshold / max) * 100)}%` }} /></div>
                    <small className="ad-muted">{p.stock} en almacén{r > 0 && ` · ${r} reservado${r === 1 ? '' : 's'}`}</small>
                  </div>
                  <div className="ad-inv-num"><strong>{f}</strong><small className={`ad-stock ${t}`}>{t === 'out' ? 'Agotado' : t === 'low' ? 'Últimas unidades' : 'Disponibles'}</small></div>
                  <div className="ad-inv-actions">
                    <button className="ad-btn primary sm" onClick={() => setModal({ p, mode: 'in' })}><Icon name="plus" />Entrada</button>
                    <button className="ad-btn sm" onClick={() => setModal({ p, mode: 'set' })}><Icon name="edit" />Ajustar</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {untracked.length > 0 && <p className="ad-muted sm">Sin control de stock (siempre a la venta): {untracked.map((p) => p.name).join(', ')}. Actívalo desde Productos.</p>}
      </section>

      {packs.length > 0 && (
        <section className="ad-card ad-rise">
          <div className="ad-card-head"><h3><Icon name="bag" />Packs</h3><small className="ad-muted">Se calculan solos con los botes de los productos que llevan</small></div>
          <ul className="ad-inv-list">
            {packs.map((p) => {
              const { n, limit } = packAvail(p); const t = tone(n);
              return (
                <li key={p.id} className={`ad-inv-row ${t}`}>
                  <span className="ad-inv-img">{p.images?.[0] ? <img src={p.images[0]} alt="" /> : <Icon name="image" />}</span>
                  <div className="ad-inv-main">
                    <strong>{p.name}</strong>
                    <small className="ad-muted">Lleva {comps.filter((c) => c.pack_id === p.id).map((c) => `${c.qty > 1 ? `${c.qty}× ` : ''}${byId.get(c.component_id)?.name ?? '?'}`).join(' + ')}</small>
                    {limit && n !== null && <small className="ad-muted">Lo limita: <strong>{limit.name}</strong></small>}
                  </div>
                  <div className="ad-inv-num"><strong>{n ?? '∞'}</strong><small className={`ad-stock ${t}`}>{n === null ? 'Sin límite' : t === 'out' ? 'Agotado' : t === 'low' ? 'Últimas unidades' : 'Se pueden vender'}</small></div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="ad-inv-grid">
        <section className="ad-card ad-rise">
          <h3><Icon name="gear" />Avisos y reservas</h3>
          <label className="ad-field"><span>Avisar de «últimas unidades» con</span>
            <span className="ad-input-suffix"><input type="number" min={1} max={50} value={inv.low_stock_threshold} onChange={(e) => setInv({ ...inv, low_stock_threshold: Number(e.target.value) })} /><b>o menos</b></span>
          </label>
          <div className="ad-field"><span>Qué ve el cliente</span>
            <div className="ad-seg">
              <button type="button" className={inv.show_exact ? 'active' : ''} onClick={() => setInv({ ...inv, show_exact: true })}>«¡Quedan solo 3!»</button>
              <button type="button" className={!inv.show_exact ? 'active' : ''} onClick={() => setInv({ ...inv, show_exact: false })}>«¡Últimas unidades!»</button>
            </div>
          </div>
          <label className="ad-field"><span>Tiempo que se guarda el producto mientras el cliente paga</span>
            <select value={inv.reserve_minutes} onChange={(e) => setInv({ ...inv, reserve_minutes: Number(e.target.value) })}>
              {[30, 45, 60, 120].map((m) => <option key={m} value={m}>{m < 60 ? `${m} minutos` : `${m / 60} ${m === 60 ? 'hora' : 'horas'}`}</option>)}
            </select>
            <small className="ad-muted">Si no paga en ese tiempo, el pago caduca y los botes vuelven a estar a la venta. 30 minutos es el mínimo que permite Stripe.</small>
          </label>
          <label className="ad-switch-row"><Switch on={inv.notify_low_stock} onChange={(v) => setInv({ ...inv, notify_low_stock: v })} label="Email de stock bajo" /><span>Enviarme un email cuando algo baje del aviso</span></label>
          <div className="ad-modal-actions"><button className="ad-btn primary" disabled={!dirty} onClick={saveInv}><Icon name="check" />Guardar ajustes</button></div>
        </section>

        <section className="ad-card ad-rise">
          <h3><Icon name="lock" />Reservas activas</h3>
          {resList.length === 0 ? <p className="ad-muted">Ahora mismo nadie está pagando.</p> : (
            <ul className="ad-res-list">
              {resList.map((r) => (
                <li key={r.id}>
                  <span>{r.items.map((i) => `${i.qty}× ${byId.get(i.product_id)?.name ?? '?'}`).join(', ')}</span>
                  <small className="ad-muted">Caduca {when(r.expires_at)}</small>
                </li>
              ))}
            </ul>
          )}
          <p className="ad-muted sm">Cuando el cliente paga, la reserva se convierte en venta y los botes se descuentan del almacén.</p>
        </section>
      </div>

      <section className="ad-card ad-rise">
        <h3><Icon name="history" />Historial de movimientos</h3>
        {log.length === 0 ? <p className="ad-muted">Aún no hay movimientos. Aquí verás cada venta, entrada y ajuste.</p> : (
          <div className="ad-table-scroll">
            <table className="ad-table">
              <thead><tr><th>Fecha</th><th>Producto</th><th>Motivo</th><th style={{ textAlign: 'right' }}>Botes</th></tr></thead>
              <tbody>
                {log.map((l) => (
                  <tr key={l.id}>
                    <td className="ad-muted">{when(l.created_at)}</td>
                    <td>{byId.get(l.product_id ?? '')?.name ?? '—'}</td>
                    <td>{l.reason.charAt(0).toUpperCase() + l.reason.slice(1)}{l.order_number && <span className="ad-muted"> · pedido #{l.order_number}</span>}</td>
                    <td style={{ textAlign: 'right' }}><strong className={l.delta < 0 ? 'ad-neg' : 'ad-pos'}>{l.delta > 0 ? `+${l.delta}` : l.delta}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal && <StockModal p={modal.p} mode={modal.mode} onClose={() => setModal(null)} onDone={(msg) => { setModal(null); toast(msg); load(); }} />}
    </div>
  );
}

function StockModal({ p, mode, onClose, onDone }: { p: P; mode: 'in' | 'set'; onClose: () => void; onDone: (msg: string) => void }) {
  const toast = useToast();
  const [n, setN] = useState(mode === 'in' ? '' : String(p.stock ?? 0));
  const [reason, setReason] = useState(mode === 'in' ? '' : REASONS[0]);
  const [busy, setBusy] = useState(false);
  const num = Math.floor(Number(n));
  const valid = n !== '' && Number.isFinite(num) && num >= 0 && (mode === 'set' || num > 0);
  const delta = mode === 'in' ? num : num - (p.stock ?? 0);
  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || delta === 0) return onClose();
    setBusy(true);
    const why = mode === 'in' ? `entrada${reason.trim() ? ` · ${reason.trim()}` : ''}` : reason.toLowerCase();
    const { data, error } = await sb().rpc('adjust_stock', { p_product: p.id, p_delta: delta, p_reason: why });
    setBusy(false);
    if (error) return toast('No se pudo guardar', 'err');
    onDone(`${p.name}: ahora hay ${data} botes`);
    const t = (await sb().auth.getSession()).data.session?.access_token;
    fetch('/api/revalidate', { method: 'POST', headers: { authorization: `Bearer ${t ?? ''}` } }).catch(() => {});
  }
  return (
    <Modal title={mode === 'in' ? `Entrada de ${p.name}` : `Ajustar ${p.name}`} onClose={onClose}>
      <form onSubmit={go}>
        <p className="ad-muted">Ahora hay <strong>{p.stock}</strong> botes en el almacén.</p>
        <label className="ad-field"><span>{mode === 'in' ? '¿Cuántos botes han llegado?' : '¿Cuántos botes hay de verdad?'}</span>
          <input type="number" min={0} inputMode="numeric" value={n} onChange={(e) => setN(e.target.value)} data-autofocus autoFocus />
        </label>
        {mode === 'in' ? (
          <label className="ad-field"><span>Nota <small>(opcional)</small></span><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej. Pedido al proveedor de noviembre" /></label>
        ) : (
          <label className="ad-field"><span>Motivo</span><select value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select></label>
        )}
        {valid && delta !== 0 && <p className="ad-muted">Quedarán <strong>{(p.stock ?? 0) + delta}</strong> botes ({delta > 0 ? `+${delta}` : delta}).</p>}
        <div className="ad-modal-actions">
          <button type="button" className="ad-btn" onClick={onClose}>Cancelar</button>
          <button className="ad-btn primary" disabled={!valid || busy}>{busy ? <span className="ad-spinner sm" /> : <Icon name="check" />}{mode === 'in' ? 'Añadir botes' : 'Guardar recuento'}</button>
        </div>
      </form>
    </Modal>
  );
}
