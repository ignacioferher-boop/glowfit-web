// Construye el Excel de copia de seguridad (pedidos, clientes, mensajes y stock).
// Se usa en el servidor (copia diaria por email) y en el panel (botón "Descargar Excel").
import ExcelJS from 'exceljs';

type Addr = { line1?: string | null; line2?: string | null; city?: string | null; postal_code?: string | null; state?: string | null; country?: string | null } | null;
export type BackupData = {
  orders: { order_number: number | null; created_at: string; status: string; fulfillment: string | null; name: string | null; email: string | null; phone: string | null; shipping_address: Addr; items: { name?: string; qty?: number }[] | null; subtotal_cents: number | null; shipping_cents: number | null; total_cents: number | null; tracking: string | null; notes: string | null; accepts_marketing: boolean | null }[];
  customers: { created_at: string; name: string; email: string; phone: string | null; accepts_marketing: boolean | null; terms_version: string | null; cart: { slug?: string; qty?: number }[] | null }[];
  messages: { created_at: string; name: string; email: string; phone: string | null; message: string }[];
  products: { name: string; stock: number | null; active: boolean; price_cents: number }[];
};

const fecha = (d: string) => new Date(d).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'short', timeStyle: 'short' });
const eur = (c: number | null | undefined) => (c ?? 0) / 100;
const PAGO: Record<string, string> = { paid: 'Pagado', unpaid: 'Pendiente', no_payment_required: 'Sin pago' };
const ENVIO: Record<string, string> = { nuevo: 'Nuevo', preparando: 'Preparando', enviado: 'Enviado', entregado: 'Entregado', cancelado: 'Cancelado' };

function sheet(wb: ExcelJS.Workbook, name: string, cols: { header: string; key: string; width: number; money?: boolean }[], rows: Record<string, unknown>[]) {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = cols.map((c) => ({ header: c.header, key: c.key, width: c.width, style: c.money ? { numFmt: '#,##0.00 "€"' } : {} }));
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F4A3A' } };
  rows.forEach((r) => ws.addRow(r));
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
  return ws;
}

export async function buildBackup(d: BackupData): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Glowfit'; wb.created = new Date();
  sheet(wb, 'Pedidos', [
    { header: 'Nº pedido', key: 'n', width: 10 }, { header: 'Fecha', key: 'f', width: 16 }, { header: 'Pago', key: 'p', width: 11 }, { header: 'Envío', key: 'e', width: 12 },
    { header: 'Cliente', key: 'c', width: 24 }, { header: 'Email', key: 'm', width: 28 }, { header: 'Teléfono', key: 't', width: 15 },
    { header: 'Dirección', key: 'a', width: 34 }, { header: 'CP', key: 'cp', width: 8 }, { header: 'Ciudad', key: 'ci', width: 16 }, { header: 'Provincia', key: 'pr', width: 14 },
    { header: 'Productos', key: 'it', width: 40 }, { header: 'Subtotal', key: 's', width: 11, money: true }, { header: 'Gastos envío', key: 'se', width: 12, money: true }, { header: 'Total', key: 'to', width: 11, money: true },
    { header: 'Seguimiento', key: 'tr', width: 18 }, { header: 'Notas', key: 'no', width: 30 }, { header: 'Acepta promociones', key: 'am', width: 12 },
  ], d.orders.map((o) => ({
    n: o.order_number, f: fecha(o.created_at), p: PAGO[o.status] ?? o.status, e: ENVIO[o.fulfillment ?? ''] ?? o.fulfillment ?? '', c: o.name, m: o.email, t: o.phone,
    a: [o.shipping_address?.line1, o.shipping_address?.line2].filter(Boolean).join(', '), cp: o.shipping_address?.postal_code, ci: o.shipping_address?.city, pr: o.shipping_address?.state,
    it: (o.items ?? []).map((i) => `${i.qty ?? 1}× ${i.name ?? ''}`).join(' · '), s: eur(o.subtotal_cents), se: eur(o.shipping_cents), to: eur(o.total_cents),
    tr: o.tracking, no: o.notes, am: o.accepts_marketing ? 'Sí' : 'No',
  })));
  sheet(wb, 'Clientes', [
    { header: 'Fecha', key: 'f', width: 16 }, { header: 'Nombre', key: 'n', width: 24 }, { header: 'Email', key: 'm', width: 28 }, { header: 'Teléfono', key: 't', width: 15 },
    { header: 'Acepta promociones', key: 'am', width: 12 }, { header: 'Condiciones aceptadas', key: 'tv', width: 14 }, { header: 'Carrito', key: 'ca', width: 40 },
  ], d.customers.map((c) => ({ f: fecha(c.created_at), n: c.name, m: c.email, t: c.phone, am: c.accepts_marketing ? 'Sí' : 'No', tv: c.terms_version, ca: (c.cart ?? []).map((i) => `${i.qty ?? 1}× ${i.slug ?? ''}`).join(' · ') })));
  sheet(wb, 'Mensajes', [
    { header: 'Fecha', key: 'f', width: 16 }, { header: 'Nombre', key: 'n', width: 24 }, { header: 'Email', key: 'm', width: 28 }, { header: 'Teléfono', key: 't', width: 15 }, { header: 'Mensaje', key: 'x', width: 80 },
  ], d.messages.map((m) => ({ f: fecha(m.created_at), n: m.name, m: m.email, t: m.phone, x: m.message })));
  sheet(wb, 'Stock', [
    { header: 'Producto', key: 'n', width: 32 }, { header: 'Botes', key: 's', width: 10 }, { header: 'Precio', key: 'p', width: 11, money: true }, { header: 'En la tienda', key: 'a', width: 12 },
  ], d.products.map((p) => ({ n: p.name, s: p.stock ?? 'Sin control', p: eur(p.price_cents), a: p.active ? 'Sí' : 'No' })));
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

export const backupName = (d = new Date()) => `glowfit-copia-${d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' })}.xlsx`;
