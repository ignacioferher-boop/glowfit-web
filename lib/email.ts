// Emails de pedido con Resend (https://resend.com). Se activan al poner RESEND_API_KEY y EMAIL_FROM en Vercel.
import { media } from './config';
import { LEGAL } from './legal';

type Item = { name: string | null; qty: number | null; total_cents: number | null };
export type OrderMail = {
  order_number: number; name: string; email: string; phone?: string | null;
  address?: Record<string, string | null> | null; items: Item[]; shipping_cents: number; total_cents: number;
};

const eur = (c: number | null | undefined) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format((c ?? 0) / 100);
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

function addressHtml(a?: OrderMail['address']) {
  if (!a) return '';
  return [a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(' '), a.state].filter(Boolean).map(esc).join('<br>');
}

function layout(title: string, body: string) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f8f2ea;font-family:Helvetica,Arial,sans-serif;color:#464e34">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f2ea;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td align="center" style="padding:28px 24px 8px"><img src="${media('2026/05/LOGO-GLOWFIT.png')}" width="140" alt="Glowfit" style="display:block"></td></tr>
<tr><td style="padding:8px 32px 32px"><h1 style="font-family:Georgia,serif;font-weight:400;font-size:26px;text-align:center;margin:8px 0 20px">${title}</h1>${body}</td></tr>
<tr><td style="background:#f8f2ea;padding:18px 32px;font-size:12px;color:#636363;text-align:center">Glowfit · ${esc(LEGAL.owner)} · ${esc(LEGAL.email)}</td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(o: OrderMail) {
  const rows = o.items.map((i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.qty)} × ${esc(i.name)}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #eee">${eur(i.total_cents)}</td></tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">${rows}
<tr><td style="padding:8px 0;color:#636363">Envío</td><td align="right" style="padding:8px 0;color:#636363">${o.shipping_cents ? eur(o.shipping_cents) : 'Gratis'}</td></tr>
<tr><td style="padding:10px 0;font-size:18px;font-family:Georgia,serif">Total (IVA incluido)</td><td align="right" style="padding:10px 0;font-size:18px;font-family:Georgia,serif">${eur(o.total_cents)}</td></tr></table>`;
}

export function customerEmail(o: OrderMail) {
  const first = esc(o.name.split(' ')[0]);
  return {
    subject: `Pedido #${o.order_number} confirmado · Glowfit`,
    html: layout('¡Gracias por tu pedido!', `<p style="font-size:15px;line-height:1.6">Hola ${first}, hemos recibido tu pedido <strong>#${o.order_number}</strong> y ya lo estamos preparando. Te avisaremos cuando salga.</p>
${itemsTable(o)}
<p style="font-size:14px;margin:20px 0 4px"><strong>Dirección de envío</strong></p><p style="font-size:14px;line-height:1.5;margin:0">${esc(o.name)}<br>${addressHtml(o.address)}</p>
<p style="font-size:14px;line-height:1.6;margin-top:20px">Plazo de entrega: 2–4 días laborables. Si tienes cualquier duda, responde a este email.</p>`),
  };
}

export function shopEmail(o: OrderMail) {
  return {
    subject: `Nuevo pedido #${o.order_number} · ${eur(o.total_cents)}`,
    html: layout(`Nuevo pedido #${o.order_number}`, `<p style="font-size:15px;line-height:1.6"><strong>${esc(o.name)}</strong><br>${esc(o.email)}${o.phone ? `<br>${esc(o.phone)}` : ''}</p>
<p style="font-size:14px;line-height:1.5">${addressHtml(o.address)}</p>${itemsTable(o)}`),
  };
}

export async function sendEmail(to: string, msg: { subject: string; html: string }, replyTo?: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM; // ej. "Glowfit <pedidos@tudominio.es>"
  if (!key || !from) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject: msg.subject, html: msg.html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!r.ok) console.error('Resend', r.status, await r.text());
  return r.ok;
}
