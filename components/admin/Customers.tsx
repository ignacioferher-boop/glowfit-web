'use client';
import { useEffect, useMemo, useState } from 'react';
import { sb } from '@/lib/supabase-browser';
import { Empty, Icon, Skeleton, downloadCSV, when, type Customer } from './ui';

export default function Customers() {
  const [rows, setRows] = useState<Customer[] | null>(null);
  const [q, setQ] = useState('');
  const [only, setOnly] = useState(false);
  useEffect(() => {
    sb().from('customers').select('id,created_at,name,email,phone,accepts_marketing').order('created_at', { ascending: false }).limit(5000)
      .then(({ data }) => setRows((data as Customer[]) ?? []));
  }, []);
  const unique = useMemo(() => { const m = new Map<string, Customer>(); (rows ?? []).forEach((r) => { const k = r.email.toLowerCase(); if (!m.has(k)) m.set(k, r); }); return [...m.values()]; }, [rows]);
  const list = unique.filter((r) => (!only || r.accepts_marketing) && (!q || `${r.name} ${r.email} ${r.phone}`.toLowerCase().includes(q.toLowerCase())));
  const optIn = unique.filter((r) => r.accepts_marketing).length;

  if (!rows) return <Skeleton rows={6} />;
  return (
    <>
      <div className="ad-kpis three">
        <div className="ad-kpi ad-rise"><span className="ad-kpi-icon"><Icon name="users" /></span><small>Clientes registrados</small><strong>{unique.length}</strong></div>
        <div className="ad-kpi ad-rise" style={{ animationDelay: '60ms' }}><span className="ad-kpi-icon"><Icon name="mail" /></span><small>Aceptan promociones</small><strong>{optIn}</strong><span className="ad-muted sm">{unique.length ? Math.round((optIn / unique.length) * 100) : 0}% del total</span></div>
        <div className="ad-kpi ad-rise" style={{ animationDelay: '120ms' }}><span className="ad-kpi-icon"><Icon name="download" /></span><small>Para tu herramienta de email</small>
          <button className="ad-btn sm" disabled={!optIn} onClick={() => downloadCSV('clientes-promociones.csv', [['Nombre', 'Email', 'Teléfono'], ...unique.filter((r) => r.accepts_marketing).map((r) => [r.name, r.email, r.phone])])}>Descargar lista de promociones</button></div>
      </div>
      <div className="ad-toolbar ad-rise">
        <div className="ad-search"><Icon name="search" /><input type="search" placeholder="Buscar por nombre, email o teléfono" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar clientes" /></div>
        <label className="ad-check"><input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} />Solo los que aceptan promociones</label>
        <button className="ad-btn" disabled={!list.length} onClick={() => downloadCSV('clientes-glowfit.csv', [['Nombre', 'Email', 'Teléfono', 'Acepta promociones', 'Fecha'], ...list.map((r) => [r.name, r.email, r.phone, r.accepts_marketing ? 'Sí' : 'No', when(r.created_at)])])}><Icon name="download" />Exportar</button>
      </div>
      {list.length === 0 ? <div className="ad-card"><Empty icon="users" title={unique.length ? 'Nadie coincide' : 'Aún no hay clientes'} text={unique.length ? 'Prueba con otra búsqueda.' : 'Cada persona que rellene sus datos en el carrito aparecerá aquí.'} /></div> : (
        <div className="ad-card flush ad-rise">
          <table className="ad-table static">
            <thead><tr><th>Cliente</th><th>Email</th><th>Teléfono</th><th>Promociones</th><th>Registro</th></tr></thead>
            <tbody>{list.map((r) => (
              <tr key={r.id}>
                <td data-l="Cliente"><span className="ad-who"><span className="ad-avatar soft">{r.name.charAt(0).toUpperCase()}</span>{r.name}</span></td>
                <td data-l="Email"><a href={`mailto:${r.email}`}>{r.email}</a></td>
                <td data-l="Teléfono"><a href={`tel:${r.phone}`}>{r.phone}</a></td>
                <td data-l="Promociones">{r.accepts_marketing ? <span className="ad-badge f-entregado"><i />Sí</span> : <span className="ad-badge f-cancelado"><i />No</span>}</td>
                <td data-l="Registro">{when(r.created_at)}</td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
