'use client';
import { useEffect, useMemo, useState } from 'react';
import { sb } from '@/lib/supabase-browser';
import { media } from '@/lib/config';
import { Badge, Drawer, Empty, FULFILL, Icon, Skeleton, downloadCSV, eur, fLabel, useToast, when, whenLong, type Order } from './ui';

const addr = (a: Order['shipping_address']) => (a ? [a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(' '), a.state].filter(Boolean) : []);

export default function Orders({ orders, reload, focusId, clearFocus }: { orders: Order[] | null; reload: () => Promise<void>; focusId: string | null; clearFocus: () => void }) {
  const [filter, setFilter] = useState('todos');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { if (focusId) { setOpen(focusId); clearFocus(); } }, [focusId, clearFocus]);

  const counts = useMemo(() => Object.fromEntries(FULFILL.map((f) => [f.v, (orders ?? []).filter((o) => o.fulfillment === f.v).length])), [orders]);
  const list = useMemo(() => (orders ?? []).filter((o) =>
    (filter === 'todos' || o.fulfillment === filter) &&
    (!q || `${o.order_number} ${o.name} ${o.email} ${o.phone ?? ''} ${o.shipping_address?.city ?? ''}`.toLowerCase().includes(q.toLowerCase().replace('#', '')))), [orders, filter, q]);
  const current = (orders ?? []).find((o) => o.id === open) ?? null;

  function exportCSV() {
    downloadCSV('pedidos-glowfit.csv', [
      ['Nº', 'Fecha', 'Cliente', 'Email', 'Teléfono', 'Dirección', 'Productos', 'Envío', 'Total', 'Estado', 'Seguimiento'],
      ...list.map((o) => [o.order_number ?? '', when(o.created_at), o.name, o.email, o.phone ?? '', addr(o.shipping_address).join(', '),
        (o.items ?? []).map((i) => `${i.qty}x ${i.name}`).join(' | '), (o.shipping_cents / 100).toFixed(2).replace('.', ','), (o.total_cents / 100).toFixed(2).replace('.', ','), fLabel(o.fulfillment), o.tracking ?? '']),
    ]);
  }

  if (!orders) return <Skeleton rows={6} />;
  return (
    <>
      <div className="ad-toolbar ad-rise">
        <div className="ad-search"><Icon name="search" /><input type="search" placeholder="Buscar por nº, nombre, email, teléfono o ciudad" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar pedidos" /></div>
        <button className="ad-btn" onClick={exportCSV} disabled={!list.length}><Icon name="download" />Exportar</button>
      </div>
      <div className="ad-chips ad-rise" role="tablist" aria-label="Filtrar por estado">
        <button role="tab" aria-selected={filter === 'todos'} className={filter === 'todos' ? 'active' : ''} onClick={() => setFilter('todos')}>Todos <em>{orders.length}</em></button>
        {FULFILL.map((f) => <button key={f.v} role="tab" aria-selected={filter === f.v} className={filter === f.v ? 'active' : ''} onClick={() => setFilter(f.v)}>{f.l} <em>{counts[f.v]}</em></button>)}
      </div>

      {list.length === 0 ? (
        <div className="ad-card">{orders.length === 0
          ? <Empty icon="orders" title="Todavía no hay pedidos" text="Cada pedido pagado aparecerá aquí al momento, con todos sus datos." />
          : <Empty icon="search" title="Ningún pedido coincide" text="Prueba con otro filtro o búsqueda." action={<button className="ad-btn" onClick={() => { setFilter('todos'); setQ(''); }}>Quitar filtros</button>} />}</div>
      ) : (
        <div className="ad-card flush ad-rise">
          <table className="ad-table">
            <thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Productos</th><th className="r">Total</th><th>Estado</th></tr></thead>
            <tbody>
              {list.map((o, i) => (
                <tr key={o.id} onClick={() => setOpen(o.id)} onKeyDown={(e) => e.key === 'Enter' && setOpen(o.id)} tabIndex={0} style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
                  <td data-l="Pedido"><strong>#{o.order_number}</strong>{o.status !== 'paid' && <small className="ad-warn">Pago {o.status}</small>}</td>
                  <td data-l="Fecha">{when(o.created_at)}</td>
                  <td data-l="Cliente"><span className="ad-cell-main">{o.name}</span><small>{o.shipping_address?.city ?? o.email}</small></td>
                  <td data-l="Productos" className="ad-ellipsis">{(o.items ?? []).map((i) => `${i.qty}× ${i.name}`).join(', ')}</td>
                  <td data-l="Total" className="r"><strong>{eur(o.total_cents)}</strong></td>
                  <td data-l="Estado"><Badge v={o.fulfillment} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {current && <OrderDetail order={current} onClose={() => setOpen(null)} reload={reload} />}
    </>
  );
}

function OrderDetail({ order, onClose, reload }: { order: Order; onClose: () => void; reload: () => Promise<void> }) {
  const toast = useToast();
  const [tracking, setT] = useState(order.tracking ?? '');
  const [notes, setN] = useState(order.notes ?? '');
  const [busy, setBusy] = useState(false);
  const steps = ['nuevo', 'preparando', 'enviado', 'entregado'];
  const idx = steps.indexOf(order.fulfillment);
  const next = idx >= 0 && idx < steps.length - 1 ? steps[idx + 1] : null;
  const dirty = tracking !== (order.tracking ?? '') || notes !== (order.notes ?? '');

  async function update(patch: Partial<Order>, ok: string) {
    setBusy(true);
    const { error } = await sb().from('orders').update(patch).eq('id', order.id);
    setBusy(false);
    if (error) return toast('No se pudo guardar. Inténtalo otra vez.', 'err');
    toast(ok); await reload();
  }
  function copyAddress() {
    navigator.clipboard?.writeText([order.name, ...addr(order.shipping_address), order.phone ?? ''].filter(Boolean).join('\n'));
    toast('Dirección copiada');
  }
  function printSlip() {
    const w = window.open('', '_blank', 'width=720,height=900');
    if (!w) return;
    const rows = (order.items ?? []).map((i) => `<tr><td>${i.qty}</td><td>${i.name}</td></tr>`).join('');
    w.document.write(`<!doctype html><html><head><title>Albarán #${order.order_number}</title><style>body{font-family:Helvetica,Arial,sans-serif;color:#222;padding:32px}h1{font-size:22px;margin:16px 0 4px}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left}.box{border:1px solid #ccc;border-radius:8px;padding:12px 16px;margin-top:16px;font-size:15px;line-height:1.5}</style></head><body>
<img src="${media('2026/05/LOGO-GLOWFIT.png')}" width="120"><h1>Albarán · Pedido #${order.order_number}</h1><div>${whenLong(order.created_at)}</div>
<div class="box"><strong>Enviar a:</strong><br>${order.name}<br>${addr(order.shipping_address).join('<br>')}<br>${order.phone ?? ''}</div>
<table><thead><tr><th>Uds.</th><th>Producto</th></tr></thead><tbody>${rows}</tbody></table>
<p style="margin-top:32px;font-size:13px;color:#666">¡Gracias por confiar en Glowfit!</p><script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  }

  return (
    <Drawer title={`Pedido #${order.order_number}`} sub={whenLong(order.created_at)} onClose={onClose}
      footer={<>{next && order.fulfillment !== 'cancelado' && <button className="ad-btn primary" disabled={busy} onClick={() => update({ fulfillment: next }, `Pedido marcado como ${fLabel(next).toLowerCase()}`)}><Icon name={next === 'enviado' ? 'truck' : 'check'} />Marcar como {fLabel(next).toLowerCase()}</button>}
        <button className="ad-btn" onClick={printSlip}><Icon name="print" />Albarán</button></>}>
      <div className="ad-steps" aria-label="Estado del pedido">
        {steps.map((s, i) => <div key={s} className={`ad-step${i <= idx ? ' done' : ''}${i === idx ? ' now' : ''}`}><span>{i < idx ? <Icon name="check" size={14} /> : i + 1}</span><small>{fLabel(s)}</small></div>)}
      </div>
      {order.fulfillment === 'cancelado' && <p className="ad-note warn">Este pedido está cancelado.</p>}
      {order.status !== 'paid' && <p className="ad-note warn">El pago aparece como «{order.status}». Revísalo en Stripe antes de enviar.</p>}

      <div className="ad-detail-grid">
        <div className="ad-box">
          <h4>Cliente</h4>
          <p className="ad-strong">{order.name}</p>
          <a href={`mailto:${order.email}?subject=Tu pedido Glowfit #${order.order_number}`} className="ad-line"><Icon name="mail" size={16} />{order.email}</a>
          {order.phone && <a href={`tel:${order.phone}`} className="ad-line"><Icon name="phone" size={16} />{order.phone}</a>}
          {order.phone && <a href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '').replace(/^(?!34)(\d{9})$/, '34$1')}`} target="_blank" rel="noopener" className="ad-line"><Icon name="ext" size={16} />Escribir por WhatsApp</a>}
          <p className="ad-muted sm">{order.accepts_marketing === false ? 'No quiere recibir promociones' : 'Acepta recibir promociones'}{order.email_sent_at ? ' · Email de confirmación enviado' : ''}</p>
        </div>
        <div className="ad-box">
          <h4>Dirección de envío <button className="ad-link" onClick={copyAddress}><Icon name="copy" size={14} />Copiar</button></h4>
          <p className="ad-addr"><Icon name="pin" size={16} /><span>{addr(order.shipping_address).map((l, i) => <span key={i}>{l}<br /></span>)}</span></p>
        </div>
      </div>

      <div className="ad-box">
        <h4>Productos</h4>
        <ul className="ad-lines">
          {(order.items ?? []).map((i, n) => <li key={n}><span><em>{i.qty}×</em> {i.name}</span><span>{eur(i.total_cents)}</span></li>)}
          <li className="sub"><span>Subtotal</span><span>{eur(order.subtotal_cents)}</span></li>
          <li className="sub"><span>Envío</span><span>{order.shipping_cents ? eur(order.shipping_cents) : 'Gratis'}</span></li>
          <li className="tot"><span>Total</span><span>{eur(order.total_cents)}</span></li>
        </ul>
      </div>

      <div className="ad-box">
        <h4>Gestión</h4>
        <label className="ad-field"><span>Estado</span>
          <select value={order.fulfillment} onChange={(e) => update({ fulfillment: e.target.value }, `Estado cambiado a ${fLabel(e.target.value).toLowerCase()}`)} disabled={busy}>
            {FULFILL.map((f) => <option key={f.v} value={f.v}>{f.l}</option>)}
          </select></label>
        <label className="ad-field"><span>Nº de seguimiento</span><input value={tracking} onChange={(e) => setT(e.target.value)} placeholder="Código de Correos, SEUR, GLS…" /></label>
        <label className="ad-field"><span>Notas internas</span><textarea rows={3} value={notes} onChange={(e) => setN(e.target.value)} placeholder="Solo las ve el equipo" /></label>
        <button className="ad-btn" disabled={!dirty || busy} onClick={() => update({ tracking: tracking || null, notes: notes || null }, 'Cambios guardados')}>Guardar seguimiento y notas</button>
      </div>
    </Drawer>
  );
}
