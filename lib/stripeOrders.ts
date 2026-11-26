import { revalidatePath } from 'next/cache';
import type Stripe from 'stripe';
import { supabasePublic } from '@/lib/data';
import { customerEmail, lowStockEmail, sendEmail, shopEmail } from '@/lib/email';
import { getInventorySettings } from '@/lib/settings';

/** Guarda en la base de datos una sesión de pago de Stripe (idempotente) y envía los correos una sola vez. */
export async function recordPaidSession(stripe: Stripe, sessionId: string, orderSecret: string): Promise<{ ok: true; order_number?: number } | { ok: false; error: string }> {
  if (!supabasePublic) return { ok: false, error: 'db' };
    const full = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items', 'invoice'] });
    const inv = full.invoice && typeof full.invoice === 'object' ? full.invoice : null;
    const invoiceUrl = inv?.hosted_invoice_url || inv?.invoice_pdf || null;
    const shipping = full.collected_information?.shipping_details;
    const items = (full.line_items?.data || []).map((li) => ({
      name: li.description, qty: li.quantity, unit_cents: li.price?.unit_amount, total_cents: li.amount_total,
    }));
    const order = {
      stripe_session_id: full.id,
      status: full.payment_status === 'paid' ? 'paid' : full.payment_status,
      email: full.customer_details?.email || full.customer_email,
      name: full.metadata?.name || shipping?.name || full.customer_details?.name,
      phone: full.metadata?.phone || full.customer_details?.phone,
      shipping_address: shipping?.address ?? full.customer_details?.address ?? null,
      items,
      subtotal_cents: full.amount_subtotal ?? 0,
      shipping_cents: full.total_details?.amount_shipping ?? 0,
      total_cents: full.amount_total ?? 0,
      accepts_marketing: full.metadata?.accepts_marketing !== 'false',
      stock_items: (() => { try { return JSON.parse(full.metadata?.items || '[]'); } catch { return []; } })(),
    };
    const { data, error } = await supabasePublic.rpc('record_order', { p_secret: orderSecret, p_order: order });
    if (error) {
      console.error('Error guardando pedido', error);
      return { ok: false as const, error: 'db' };
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (order.status === 'paid') revalidatePath('/', 'layout'); // refresca el stock visible en la tienda
    // Emails de confirmación (solo una vez y solo si el pago está hecho)
    if (row && !row.email_sent && order.status === 'paid' && order.email) {
      const taxId = (full.customer_details?.tax_ids ?? []).map((t) => t.value).filter(Boolean).join(', ') || null;
      const mail = { invoice_url: invoiceUrl, tax_id: taxId, order_number: row.order_number, name: order.name || '', email: order.email, phone: order.phone, address: order.shipping_address as Record<string, string | null> | null, items, shipping_cents: order.shipping_cents, total_cents: order.total_cents };
      const ok = await sendEmail(order.email, customerEmail(mail), process.env.ORDER_NOTIFY_EMAIL);
      if (process.env.ORDER_NOTIFY_EMAIL) await sendEmail(process.env.ORDER_NOTIFY_EMAIL, shopEmail(mail), order.email);
      if (ok) await supabasePublic.rpc('mark_order_emailed', { p_secret: orderSecret, p_session: full.id });
      // Aviso de stock bajo a la tienda (una vez por pedido)
      const inv = await getInventorySettings();
      if (inv.notify_low_stock && process.env.ORDER_NOTIFY_EMAIL) {
        const { data: low } = await supabasePublic.from('products').select('name,stock').not('stock', 'is', null).lte('stock', inv.low_stock_threshold).order('stock');
        if (low?.length) await sendEmail(process.env.ORDER_NOTIFY_EMAIL, lowStockEmail(low as { name: string; stock: number }[], inv.low_stock_threshold));
      }
    }
    return { ok: true, order_number: row?.order_number };
}
