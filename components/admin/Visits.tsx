'use client';
import { useCallback, useEffect, useState } from 'react';
import { sb } from '@/lib/supabase-browser';
import { Icon, Skeleton } from './ui';

type Day = { day: string; visitors: number; views: number };
type V = {
  now: number; today_visitors: number; today_views: number; yesterday_visitors: number;
  week_visitors: number; week_views: number; month_visitors: number;
  daily: Day[]; pages: { path: string; views: number; visitors: number }[];
  sources: { source: string; visitors: number }[]; devices: { device: string; visitors: number }[];
};
const n = (x: number) => new Intl.NumberFormat('es-ES').format(x || 0);
const NAMES: Record<string, string> = { '/': 'Inicio', '/productos/': 'Productos', '/carrito/': 'Carrito', '/blog/': 'Blog', '/checkout/exito/': 'Compra hecha', '/sobre-nosotros/': 'Contacto', '/mi-cuenta/': 'Mi cuenta' };
// Ajuste pedido por la dueña: suma visitas al panel SOLO al mostrarlas (la tabla page_views no se toca).
// Para quitarlo: NEXT_PUBLIC_VISITS_BOOST=0 en Vercel y volver a desplegar.
const BOOST = Math.max(0, Number(process.env.NEXT_PUBLIC_VISITS_BOOST ?? 100) || 0);
const BOOST_FROM = process.env.NEXT_PUBLIC_VISITS_BOOST_FROM || '2026-11-28';
const TZ = 'Europe/Madrid';
const ymd = (t: Date) => t.toLocaleDateString('en-CA', { timeZone: TZ });
const shift = (day: string, k: number) => { const t = new Date(`${day}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + k); return t.toISOString().slice(0, 10); };
// Hoy se reparte según la hora (a medianoche 0, a las 23:59 el total), los días pasados suman entero.
function boostFor(day: string, today: string, now: Date) {
  if (!BOOST || day < BOOST_FROM || day > today) return 0;
  if (day < today) return BOOST;
  const [h, m] = now.toLocaleTimeString('en-GB', { timeZone: TZ, hour12: false }).split(':').map(Number);
  return Math.round(BOOST * ((h % 24) * 60 + m) / 1440);
}
function withBoost(d: V): V {
  if (!BOOST) return d;
  const now = new Date(); const today = ymd(now);
  const ratio = d.week_visitors > 0 ? Math.max(1, d.week_views / d.week_visitors) : 1.5;
  const sum = (days: number) => { let t = 0; for (let i = 0; i < days; i++) t += boostFor(shift(today, -i), today, now); return t; };
  const bToday = boostFor(today, today, now), bYest = boostFor(shift(today, -1), today, now), bWeek = sum(7), bMonth = sum(30);
  const k = d.week_visitors > 0 ? (d.week_visitors + bWeek) / d.week_visitors : 1;
  const kv = d.week_views > 0 ? (d.week_views + Math.round(bWeek * ratio)) / d.week_views : 1;
  return {
    ...d,
    today_visitors: d.today_visitors + bToday, today_views: d.today_views + Math.round(bToday * ratio),
    yesterday_visitors: d.yesterday_visitors + bYest,
    week_visitors: d.week_visitors + bWeek, week_views: d.week_views + Math.round(bWeek * ratio),
    month_visitors: d.month_visitors + bMonth,
    daily: d.daily.map((x) => { const b = boostFor(String(x.day).slice(0, 10), today, now); return { ...x, visitors: x.visitors + b, views: x.views + Math.round(b * ratio) }; }),
    sources: d.sources.map((x) => ({ ...x, visitors: Math.round(x.visitors * k) })),
    devices: d.devices.map((x) => ({ ...x, visitors: Math.round(x.visitors * k) })),
    pages: d.pages.map((x) => ({ ...x, views: Math.round(x.views * kv), visitors: Math.round(x.visitors * k) })),
  };
}
const pageName = (p: string) => NAMES[p] ?? (p.startsWith('/producto/') ? `Producto: ${p.split('/')[2].replace(/-/g, ' ')}` : p);

export default function Visits() {
  const [d, setD] = useState<V | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    const { data, error } = await sb().rpc('admin_visits', { p_days: 14 });
    if (error) setErr('No se pudieron cargar las visitas'); else { setErr(''); setD(withBoost(data as V)); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 60_000); return () => clearInterval(t); }, [load]);

  if (err) return <p className="ad-muted">{err}</p>;
  if (!d) return <><div className="ad-kpis">{[0, 1, 2, 3].map((i) => <div key={i} className="ad-skel" style={{ height: 112 }} />)}</div><Skeleton rows={4} h={64} /></>;
  const max = Math.max(1, ...d.daily.map((x) => x.visitors));
  const kpis = [
    { i: 'eye', l: 'Ahora mismo', v: n(d.now), s: 'personas en los últimos 5 min' },
    { i: 'users', l: 'Visitantes hoy', v: n(d.today_visitors), s: `${n(d.today_views)} páginas vistas · ayer ${n(d.yesterday_visitors)}` },
    { i: 'history', l: 'Últimos 7 días', v: n(d.week_visitors), s: `${n(d.week_views)} páginas vistas` },
    { i: 'stock', l: 'Últimos 30 días', v: n(d.month_visitors), s: 'visitantes' },
  ];
  const srcMax = Math.max(1, ...d.sources.map((s) => s.visitors));
  const pgMax = Math.max(1, ...d.pages.map((s) => s.views));
  return (
    <>
      <div className="ad-toolbar ad-rise" style={{ justifyContent: 'space-between' }}>
        <p className="ad-muted sm" style={{ margin: 0 }}>Se actualiza solo cada minuto. Sin cookies: cada persona cuenta una vez al día.</p>
        <button className="ad-btn sm" onClick={load}><Icon name="refresh" size={16} />Actualizar</button>
      </div>
      <div className="ad-kpis">
        {kpis.map((k, i) => (
          <div key={k.l} className="ad-kpi ad-rise" style={{ animationDelay: `${i * 60}ms` }}>
            <span className="ad-kpi-icon"><Icon name={k.i} /></span><small>{k.l}</small><strong>{k.v}</strong><span className="ad-muted sm">{k.s}</span>
          </div>
        ))}
      </div>
      <section className="ad-card ad-rise" style={{ animationDelay: '120ms' }}>
        <div className="ad-card-head"><h3>Visitantes por día</h3><span className="ad-muted sm">Últimos 14 días</span></div>
        <div className="ad-chart" role="img" aria-label="Visitantes por día">
          {d.daily.map((x, i) => (
            <div key={x.day} className="ad-bar-col" title={`${new Date(x.day).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}: ${n(x.visitors)} visitantes · ${n(x.views)} páginas`}>
              <div className="ad-bar" style={{ height: `${Math.max(2, (x.visitors / max) * 100)}%`, animationDelay: `${i * 40}ms` }} />
            </div>
          ))}
        </div>
        <div className="ad-chart-axis"><span>{d.daily[0] && new Date(d.daily[0].day).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span><span>Hoy</span></div>
      </section>
      <div className="ad-grid-2">
        <section className="ad-card ad-rise" style={{ animationDelay: '180ms' }}>
          <div className="ad-card-head"><h3>De dónde vienen</h3><span className="ad-muted sm">7 días</span></div>
          {d.sources.length ? <ol className="ad-top">{d.sources.map((s, i) => (
            <li key={s.source}><span className="ad-rank">{i + 1}</span><span className="ad-top-name">{s.source}</span><strong>{n(s.visitors)}</strong><i className="ad-top-bar" style={{ width: `${(s.visitors / srcMax) * 100}%` }} /></li>
          ))}</ol> : <p className="ad-muted">Aún no hay visitas.</p>}
          {d.devices.length > 0 && <p className="ad-muted sm" style={{ marginTop: 12 }}>{d.devices.map((x) => `${x.device}: ${n(x.visitors)}`).join(' · ')}</p>}
        </section>
        <section className="ad-card ad-rise" style={{ animationDelay: '240ms' }}>
          <div className="ad-card-head"><h3>Páginas más vistas</h3><span className="ad-muted sm">7 días</span></div>
          {d.pages.length ? <ol className="ad-top">{d.pages.map((p, i) => (
            <li key={p.path}><span className="ad-rank">{i + 1}</span><span className="ad-top-name" style={{ textTransform: 'capitalize' }}>{pageName(p.path)}<small>{n(p.visitors)} personas</small></span><strong>{n(p.views)}</strong><i className="ad-top-bar" style={{ width: `${(p.views / pgMax) * 100}%` }} /></li>
          ))}</ol> : <p className="ad-muted">Aún no hay visitas.</p>}
        </section>
      </div>
    </>
  );
}
