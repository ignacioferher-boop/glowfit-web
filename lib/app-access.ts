import { createHmac, timingSafeEqual } from 'crypto';
import { supabasePublic } from './data';
import { appCodeEmail, sendEmail } from './email';

// App privada de clientes (glowfit.group/app): acceso con un código personal que llega por email tras la compra.
// El código hay que activarlo en 30 días; una vez activado, sirve para siempre (también para entrar desde otro móvil).

export const APP_COOKIE = 'gf_app';
const key = () => process.env.ORDER_SECRET || '';
const sign = (id: string) => createHmac('sha256', key()).update(`app:${id}`).digest('base64url').slice(0, 32);
export const sessionValue = (id: string) => `${id}.${sign(id)}`;
export function memberFromCookie(v: string | undefined | null): string | null {
  if (!v || !key()) return null;
  const [id, t] = v.split('.');
  if (!/^[0-9a-f-]{36}$/i.test(id || '') || !t) return null;
  const a = Buffer.from(sign(id)); const b = Buffer.from(t);
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}
export const cookieOptions = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 400 };

const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://glowfit.group').replace(/\/$/, '');
export const appUrl = (code?: string) => `${SITE()}/app/${code ? `?c=${encodeURIComponent(code)}` : ''}`;

type Grant = { id: string; code: string; name: string | null; email: string; already_emailed: boolean; activated: boolean };

/** Da acceso a la app (o lo renueva) y envía el código por email. Nunca lanza errores. */
export async function grantAppAccess(o: { email: string; name?: string | null; orderNumber?: number | null; source?: 'pedido' | 'guia' | 'manual'; guide?: boolean; forceEmail?: boolean }) {
  try {
    const secret = process.env.ORDER_SECRET;
    if (!secret || !supabasePublic || !o.email) return { ok: false as const, error: 'config' };
    const { data, error } = await supabasePublic.rpc('app_grant', { p_secret: secret, p_email: o.email, p_name: o.name || null, p_order_number: o.orderNumber ?? null, p_source: o.source || 'pedido', p_guide: o.guide ?? true });
    if (error) { console.error('app_grant', error.message); return { ok: false as const, error: 'db' }; }
    const m = (Array.isArray(data) ? data[0] : data) as Grant | null;
    if (!m) return { ok: false as const, error: 'db' };
    // Solo se envía una vez automáticamente (si ya lo tenía de otra compra, no se repite); desde el panel se puede reenviar.
    if (m.already_emailed && !o.forceEmail) return { ok: true as const, emailed: false, member: m };
    const sent = await sendEmail(m.email, appCodeEmail({ name: m.name || o.name || '', code: m.code, url: appUrl(m.code), activated: m.activated }), process.env.ORDER_NOTIFY_EMAIL);
    if (sent) await supabasePublic.rpc('app_mark_emailed', { p_secret: secret, p_id: m.id });
    return { ok: true as const, emailed: !!sent, member: m };
  } catch (e) { console.error('grantAppAccess', (e as Error).message); return { ok: false as const, error: 'unknown' }; }
}

// Fecha de hoy en Madrid (YYYY-MM-DD)
export const madridDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
