'use client';
import { useState } from 'react';
import { sb } from '@/lib/supabase-browser';
import { Icon, useToast } from './ui';

// Descarga al momento un Excel con pedidos, clientes, mensajes y stock.
export default function BackupCard({ delay = 0 }: { delay?: number }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function download() {
    setBusy(true);
    try {
      const all = <T,>(p: PromiseLike<{ data: T[] | null; error: unknown }>) => Promise.resolve(p).then((r) => { if (r.error) throw r.error; return r.data ?? []; });
      const [orders, customers, messages, products] = await Promise.all([
        all(sb().from('orders').select('order_number,created_at,status,fulfillment,name,email,phone,shipping_address,items,subtotal_cents,shipping_cents,total_cents,tracking,notes,accepts_marketing').order('created_at', { ascending: false }).limit(10000)),
        all(sb().from('customers').select('created_at,name,email,phone,accepts_marketing,terms_version,cart').order('created_at', { ascending: false }).limit(10000)),
        all(sb().from('contact_messages').select('created_at,name,email,phone,message').order('created_at', { ascending: false }).limit(10000)),
        all(sb().from('products').select('name,stock,active,price_cents').order('sort')),
      ]);
      const { buildBackup, backupName } = await import('@/lib/backup');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const buf = await buildBackup({ orders, customers, messages, products } as any);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      a.download = backupName(); a.click();
      toast('Excel descargado');
    } catch (e) {
      console.error(e);
      toast('No se pudo crear el Excel. Inténtalo de nuevo.', 'err');
    }
    setBusy(false);
  }
  return (
    <section className="ad-card ad-rise" style={{ animationDelay: `${delay}ms` }}>
      <h3><Icon name="download" />Copia de seguridad</h3>
      <p className="ad-muted">Cada mañana se envía automáticamente un Excel con todos los pedidos, clientes, mensajes y stock al email de pedidos. También puedes descargarlo ahora.</p>
      <button className="ad-btn primary" onClick={download} disabled={busy}>{busy ? <span className="ad-spinner sm" /> : <Icon name="download" />}Descargar Excel ahora</button>
    </section>
  );
}
