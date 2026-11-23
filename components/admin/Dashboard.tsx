'use client';
import { useMemo, useState } from 'react';
import { Badge, Empty, Icon, Skeleton, ago, eur, type Order } from './ui';

const DAY = 86400000;
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };

export default function Dashboard({ orders, openOrder, goOrders }: { orders: Order[] | null; openOrder: (id: string) => void; goOrders: () => void }) {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const valid = useMemo(() => (orders ?? []).filter((o) => o.fulfillment !== 'cancelado' && o.status === 'paid'), [orders]);

  const stats = useMemo(() => {
    const now = Date.now();
    const today = startOfDay(new Date());
    const inRange = valid.filter((o) => new Date(o.created_at).getTime() >= now - range * DAY);
    const prev = valid.filter((o) => { const t = new Date(o.created_at).getTime(); return t < now - range * DAY && t >= now - 2 * range * DAY; });
    const sum = (l: Order[]) => l.reduce((n, o) => n + o.total_cents, 0);
    const days = Array.from({ length: range }, (_, i) => {
      const s = today - (range - 1 - i) * DAY;
      const list = valid.filter((o) => { const t = new Date(o.created_at).getTime(); return t >= s && t < s + DAY; });
      return { s, total: sum(list), count: list.length };
    });
    const top = new Map<string, { qty: number; total: number }>();
    inRange.forEach((o) => o.items?.forEach((i) => { const x = top.get(i.name) ?? { qty: 0, total: 0 }; x.qty += i.qty; x.total += i.total_cents; top.set(i.name, x); }));
    return {
      todayTotal: sum(valid.filter((o) => new Date(o.created_at).getTime() >= today)),
      todayCount: valid.filter((o) => new Date(o.created_at).getTime() >= today).length,
      total: sum(inRange), count: inRange.length, prevTotal: sum(prev), prevCount: prev.length,
      avg: inRange.length ? Math.round(sum(inRange) / inRange.length) : 0,
      days, top: [...top.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 5),
    };
  }, [valid, range]);

  if (!orders) return <><div className="ad-kpis">{[0, 1, 2, 3].map((i) => <div key={i} className="ad-skel" style={{ height: 112 }} />)}</div><Skeleton rows={4} h={64} /></>;

  const toShip = orders.filter((o) => o.fulfillment === 'nuevo' || o.fulfillment === 'preparando');
  const delta = (a: number, b: number) => (b === 0 ? null : Math.round(((a - b) / b) * 100));
  const max = Math.max(...stats.days.map((d) => d.total), 1);
  const hello = new Date().getHours() < 14 ? 'Buenos días' : new Date().getHours() < 21 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <>
      <div className="ad-hello ad-rise">
        <div><h2>{hello} 👋</h2><p className="ad-muted">{toShip.length ? `Tienes ${toShip.length} ${toShip.length === 1 ? 'pedido' : 'pedidos'} por preparar o enviar.` : 'Todo al día: no hay pedidos pendientes.'}</p></div>
        <div className="ad-seg" role="group" aria-label="Periodo">
          {([7, 30, 90] as const).map((r) => <button key={r} className={range === r ? 'active' : ''} onClick={() => setRange(r)}>{r} días</button>)}
        </div>
      </div>

      <div className="ad-kpis">
        <Kpi icon="euro" label="Ventas hoy" value={eur(stats.todayTotal)} sub={`${stats.todayCount} ${stats.todayCount === 1 ? 'pedido' : 'pedidos'}`} i={0} />
        <Kpi icon="bag" label={`Ventas ${range} días`} value={eur(stats.total)} delta={delta(stats.total, stats.prevTotal)} i={1} />
        <Kpi icon="orders" label={`Pedidos ${range} días`} value={String(stats.count)} delta={delta(stats.count, stats.prevCount)} i={2} />
        <Kpi icon="ticket" label="Ticket medio" value={eur(stats.avg)} sub="por pedido" i={3} />
      </div>

      <div className="ad-grid-2">
        <section className="ad-card ad-rise" style={{ animationDelay: '120ms' }}>
          <div className="ad-card-head"><h3>Ventas por día</h3><span className="ad-muted sm">Últimos {range} días</span></div>
          {stats.total === 0 ? <Empty icon="euro" title="Aún sin ventas en este periodo" text="La gráfica se llenará sola con cada pedido pagado." /> : (
            <div className="ad-chart" role="img" aria-label={`Ventas de los últimos ${range} días, total ${eur(stats.total)}`}>
              {stats.days.map((d, i) => (
                <div key={d.s} className="ad-bar-col" title={`${new Date(d.s).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}: ${eur(d.total)} · ${d.count} pedidos`}>
                  <div className="ad-bar" style={{ height: `${Math.max(2, (d.total / max) * 100)}%`, animationDelay: `${i * (600 / range)}ms` }} />
                </div>
              ))}
            </div>
          )}
          <div className="ad-chart-axis"><span>{new Date(stats.days[0].s).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span><span>Hoy</span></div>
        </section>

        <section className="ad-card ad-rise" style={{ animationDelay: '180ms' }}>
          <div className="ad-card-head"><h3>Más vendidos</h3><span className="ad-muted sm">{range} días</span></div>
          {stats.top.length === 0 ? <Empty icon="box" title="Sin datos todavía" text="Aquí verás qué productos se venden más." /> : (
            <ol className="ad-top">
              {stats.top.map(([name, x], i) => (
                <li key={name}><span className="ad-rank">{i + 1}</span><span className="ad-top-name">{name}<small>{x.qty} uds.</small></span><strong>{eur(x.total)}</strong>
                  <i className="ad-top-bar" style={{ width: `${(x.total / stats.top[0][1].total) * 100}%` }} /></li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="ad-card ad-rise" style={{ animationDelay: '240ms' }}>
        <div className="ad-card-head"><h3>Últimos pedidos</h3><button className="ad-btn ghost sm" onClick={goOrders}>Ver todos <Icon name="right" size={16} /></button></div>
        {orders.length === 0 ? <Empty icon="orders" title="Todavía no hay pedidos" text="En cuanto alguien pague, el pedido aparecerá aquí al momento." /> : (
          <ul className="ad-recent">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id}><button onClick={() => openOrder(o.id)}>
                <span className="ad-avatar soft">{(o.name || '?').charAt(0).toUpperCase()}</span>
                <span className="ad-recent-main"><strong>{o.name}</strong><small>#{o.order_number} · {ago(o.created_at)}</small></span>
                <Badge v={o.fulfillment} /><strong className="ad-recent-total">{eur(o.total_cents)}</strong><Icon name="right" size={16} />
              </button></li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Kpi({ icon, label, value, sub, delta, i }: { icon: string; label: string; value: string; sub?: string; delta?: number | null; i: number }) {
  return (
    <div className="ad-kpi ad-rise" style={{ animationDelay: `${i * 60}ms` }}>
      <span className="ad-kpi-icon"><Icon name={icon} /></span>
      <small>{label}</small>
      <strong>{value}</strong>
      {delta !== undefined && delta !== null ? <span className={`ad-delta ${delta >= 0 ? 'up' : 'down'}`}><Icon name={delta >= 0 ? 'up' : 'down'} size={14} />{Math.abs(delta)}% vs periodo anterior</span> : <span className="ad-muted sm">{sub ?? 'sin datos del periodo anterior'}</span>}
    </div>
  );
}
