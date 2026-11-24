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
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://glowfit.group').replace(/\/$/, '');
const PANEL = `${SITE}/panel-7565gaii/`;

// Paleta de la marca
const C = { green: '#464e34', olive: '#889765', cream: '#f8f2ea', sand: '#c2a990', line: '#ece4d8', text: '#3b4130', muted: '#7a7a6e', bg: '#efe7db' };
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "'Helvetica Neue',Helvetica,Arial,sans-serif";

const waLink = (phone?: string | null) => {
  const d = String(phone ?? '').replace(/[^0-9]/g, '');
  if (d.length < 9) return '';
  return `https://wa.me/${d.length === 9 ? `34${d}` : d}`;
};

function button(href: string, label: string, primary = true) {
  const bg = primary ? C.green : '#ffffff';
  const fg = primary ? '#ffffff' : C.green;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;margin:4px 6px 4px 0"><tr><td bgcolor="${bg}" style="border-radius:999px;border:1.5px solid ${C.green}">
<a href="${esc(href)}" style="display:inline-block;padding:12px 22px;font-family:${SANS};font-size:14px;font-weight:600;color:${fg};text-decoration:none;border-radius:999px;letter-spacing:.2px">${label}</a></td></tr></table>`;
}

function addressLines(a?: OrderMail['address']) {
  if (!a) return [] as string[];
  return [a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(' '), a.state].filter(Boolean).map(esc);
}

function layout(o: { preheader: string; eyebrow: string; title: string; intro?: string; body: string; footerNote?: string }) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(o.title)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(o.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.bg}" style="background:${C.bg}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td bgcolor="${C.cream}" style="background:${C.cream};border-radius:20px 20px 0 0;padding:28px 24px 20px;text-align:center">
<a href="${SITE}" style="text-decoration:none"><img src="${media('2026/05/LOGO-GLOWFIT.png')}" width="150" alt="Glowfit" style="display:inline-block;border:0;max-width:150px;height:auto"></a>
</td></tr>
<tr><td bgcolor="${C.sand}" style="background:linear-gradient(90deg,${C.cream},${C.sand},${C.cream});height:2px;line-height:2px;font-size:0">&nbsp;</td></tr>
<tr><td bgcolor="#ffffff" style="background:#ffffff;padding:36px 36px 12px;font-family:${SANS};color:${C.text}">
<p style="margin:0 0 10px;text-align:center;font-size:11px;letter-spacing:3px;color:${C.olive};font-weight:700;text-transform:uppercase">${o.eyebrow}</p>
<h1 style="margin:0 0 12px;text-align:center;font-family:${SERIF};font-weight:400;font-size:30px;line-height:1.2;color:${C.green}">${o.title}</h1>
${o.intro ? `<p style="margin:0 auto 8px;max-width:440px;text-align:center;font-size:15px;line-height:1.6;color:${C.muted}">${o.intro}</p>` : ''}
</td></tr>
<tr><td bgcolor="#ffffff" style="background:#ffffff;padding:16px 36px 36px;font-family:${SANS};color:${C.text};font-size:15px;line-height:1.6">${o.body}</td></tr>
<tr><td bgcolor="${C.cream}" style="background:${C.cream};border-radius:0 0 20px 20px;padding:24px 28px;text-align:center;font-family:${SANS}">
${o.footerNote ? `<p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:${C.text}">${o.footerNote}</p>` : ''}
<p style="margin:0 0 10px;font-size:13px"><a href="${SITE}/productos/" style="color:${C.green};text-decoration:none;font-weight:600">Tienda</a> &nbsp;·&nbsp; <a href="${SITE}/envios-y-entregas/" style="color:${C.green};text-decoration:none;font-weight:600">Envíos</a> &nbsp;·&nbsp; <a href="${SITE}/reembolso_devoluciones/" style="color:${C.green};text-decoration:none;font-weight:600">Devoluciones</a> &nbsp;·&nbsp; <a href="${SITE}/preguntas-frecuentes/" style="color:${C.green};text-decoration:none;font-weight:600">Ayuda</a></p>
<p style="margin:0;font-size:11px;line-height:1.6;color:${C.muted}">Glowfit · ${esc(LEGAL.owner)} · ${esc(LEGAL.address)}<br><a href="mailto:${esc(LEGAL.email)}" style="color:${C.muted}">${esc(LEGAL.email)}</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function card(inner: string, bg = C.cream) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px"><tr><td bgcolor="${bg}" style="background:${bg};border-radius:14px;padding:18px 20px">${inner}</td></tr></table>`;
}
const label = (t: string) => `<p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.olive};font-weight:700">${t}</p>`;

function itemsTable(o: OrderMail) {
  const rows = o.items.map((i) => `<tr>
<td style="padding:12px 0;border-bottom:1px solid ${C.line};vertical-align:middle"><span style="display:inline-block;min-width:26px;padding:2px 8px;margin-right:10px;border-radius:999px;background:${C.cream};color:${C.green};font-size:12px;font-weight:700;text-align:center">${esc(i.qty)}×</span><span style="font-size:15px;color:${C.text}">${esc(i.name)}</span></td>
<td align="right" style="padding:12px 0;border-bottom:1px solid ${C.line};font-size:15px;white-space:nowrap;color:${C.text}">${eur(i.total_cents)}</td></tr>`).join('');
  const subtotal = o.total_cents - o.shipping_cents;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px">${rows}
<tr><td style="padding:12px 0 2px;color:${C.muted};font-size:14px">Subtotal</td><td align="right" style="padding:12px 0 2px;color:${C.muted};font-size:14px">${eur(subtotal)}</td></tr>
<tr><td style="padding:2px 0 12px;color:${C.muted};font-size:14px">Envío</td><td align="right" style="padding:2px 0 12px;color:${C.muted};font-size:14px">${o.shipping_cents ? eur(o.shipping_cents) : '<span style="color:' + C.olive + ';font-weight:700">Gratis</span>'}</td></tr>
<tr><td style="padding:14px 0 0;border-top:2px solid ${C.green};font-family:${SERIF};font-size:20px;color:${C.green}">Total <span style="font-family:${SANS};font-size:12px;color:${C.muted}">IVA incluido</span></td><td align="right" style="padding:14px 0 0;border-top:2px solid ${C.green};font-family:${SERIF};font-size:22px;color:${C.green}">${eur(o.total_cents)}</td></tr></table>`;
}

function steps(active: number) {
  const names = ['Confirmado', 'Preparando', 'Enviado', 'Entregado'];
  const cells = names.map((n, i) => {
    const on = i <= active;
    return `<td align="center" width="25%" style="padding:0 2px;vertical-align:top">
<div style="width:30px;height:30px;line-height:30px;margin:0 auto 6px;border-radius:50%;background:${on ? C.green : C.line};color:${on ? '#fff' : C.muted};font-size:13px;font-weight:700;font-family:${SANS}">${on ? '✓' : i + 1}</div>
<div style="font-size:12px;color:${on ? C.green : C.muted};font-weight:${on ? 700 : 400}">${n}</div></td>`;
  }).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 24px"><tr>${cells}</tr></table>`;
}

export function customerEmail(o: OrderMail) {
  const first = esc(o.name.split(' ')[0]);
  const addr = addressLines(o.address);
  return {
    subject: `¡Pedido #${o.order_number} confirmado! · Glowfit`,
    html: layout({
      preheader: `Hemos recibido tu pedido #${o.order_number} por ${eur(o.total_cents)}. Ya lo estamos preparando.`,
      eyebrow: `Pedido #${o.order_number}`,
      title: `¡Gracias, ${first}!`,
      intro: 'Hemos recibido tu pedido y ya lo estamos preparando con mimo. Te avisaremos en cuanto salga hacia tu casa.',
      body: `${steps(0)}
${label('Tu pedido')}${itemsTable(o)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="50%" valign="top" style="padding-right:8px">${card(`${label('Enviamos a')}<p style="margin:0;font-size:14px;line-height:1.6">${esc(o.name)}<br>${addr.join('<br>')}</p>`)}</td>
<td width="50%" valign="top" style="padding-left:8px">${card(`${label('Entrega')}<p style="margin:0;font-size:14px;line-height:1.6">En <strong>2–4 días laborables</strong> a partir de hoy.<br>Te avisaremos por email al enviarlo.</p>`)}</td>
</tr></table>
<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:12px auto 0"><tr><td>${button(`${SITE}/mi-pedido/`, 'Ver el estado de mi pedido')}</td></tr></table>
<p style="margin:10px 0 0;text-align:center;font-size:12px;color:${C.muted}">Necesitarás tu nº de pedido <strong>#${o.order_number}</strong> y este email.</p>`,
      footerNote: '¿Alguna duda con tu pedido? Responde a este email y te ayudamos encantados.',
    }),
  };
}

export function shopEmail(o: OrderMail) {
  const addr = addressLines(o.address);
  const wa = waLink(o.phone);
  const units = o.items.reduce((n, i) => n + (i.qty ?? 0), 0);
  return {
    subject: `🛍️ Nuevo pedido #${o.order_number} · ${eur(o.total_cents)} · ${o.name}`,
    html: layout({
      preheader: `${o.name} ha comprado ${units} ${units === 1 ? 'producto' : 'productos'} por ${eur(o.total_cents)}.`,
      eyebrow: 'Nuevo pedido',
      title: `#${o.order_number} · ${eur(o.total_cents)}`,
      intro: `${units} ${units === 1 ? 'producto' : 'productos'} · pago confirmado · listo para preparar`,
      body: `${card(`${label('Cliente')}<p style="margin:0 0 4px;font-size:17px;font-weight:700;color:${C.green}">${esc(o.name)}</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.6"><a href="mailto:${esc(o.email)}" style="color:${C.text}">${esc(o.email)}</a>${o.phone ? `<br>${esc(o.phone)}` : ''}</p>
${button(`mailto:${o.email}?subject=${encodeURIComponent(`Tu pedido Glowfit #${o.order_number}`)}`, 'Escribir email', false)}${wa ? button(wa, 'WhatsApp', false) : ''}${o.phone ? button(`tel:${o.phone}`, 'Llamar', false) : ''}`)}
${card(`${label('Dirección de envío')}<p style="margin:0;font-size:14px;line-height:1.6">${esc(o.name)}<br>${addr.join('<br>')}</p>`)}
${label('Productos')}${itemsTable(o)}
<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:8px auto 0"><tr><td>${button(PANEL, 'Abrir en el panel')}</td></tr></table>`,
      footerNote: 'Responde a este email para escribir directamente al cliente.',
    }),
  };
}

export function contactEmail(c: { name: string; email: string; phone: string; message: string }) {
  const wa = waLink(c.phone);
  const when = new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Madrid' }).format(new Date());
  return {
    subject: `✉️ Nuevo mensaje de ${c.name}`,
    html: layout({
      preheader: c.message.slice(0, 120),
      eyebrow: 'Formulario de contacto',
      title: 'Nuevo mensaje',
      intro: when.charAt(0).toUpperCase() + when.slice(1),
      body: `${card(`${label('De')}<p style="margin:0 0 4px;font-size:17px;font-weight:700;color:${C.green}">${esc(c.name)}</p>
<p style="margin:0;font-size:14px;line-height:1.6"><a href="mailto:${esc(c.email)}" style="color:${C.text}">${esc(c.email)}</a>${c.phone ? `<br>${esc(c.phone)}` : ''}</p>`)}
${label('Mensaje')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px"><tr><td style="border-left:3px solid ${C.olive};padding:6px 0 6px 18px;font-family:${SERIF};font-size:17px;line-height:1.7;color:${C.text};white-space:pre-wrap">${esc(c.message)}</td></tr></table>
<p style="margin:0;text-align:center">${button(`mailto:${c.email}?subject=${encodeURIComponent('Re: tu mensaje a Glowfit')}`, 'Responder')}${wa ? button(wa, 'WhatsApp', false) : ''}${c.phone ? button(`tel:${c.phone}`, 'Llamar', false) : ''}</p>`,
      footerNote: 'También puedes pulsar «Responder» en tu correo: la respuesta le llega directamente.',
    }),
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
