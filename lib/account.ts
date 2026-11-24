// Acceso de clientes sin contraseña: código por email + cookie firmada.
import { createHmac, randomInt, timingSafeEqual } from 'crypto';

export const COOKIE = 'gf_session';
const DAYS = 30;
const key = () => {
  const s = process.env.ORDER_SECRET;
  if (!s) throw new Error('Falta ORDER_SECRET');
  return s;
};
const b64 = (s: string) => Buffer.from(s).toString('base64url');
const sign = (data: string) => createHmac('sha256', key()).update(`session:${data}`).digest('base64url');

export const normEmail = (e: unknown) => String(e ?? '').trim().toLowerCase().slice(0, 200);
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0');
export const codeHash = (email: string, code: string) => createHmac('sha256', key()).update(`code:${email}:${code}`).digest('hex');

export function makeSession(email: string) {
  const data = b64(JSON.stringify({ e: email, x: Date.now() + DAYS * 86400000 }));
  return { value: `${data}.${sign(data)}`, maxAge: DAYS * 86400 };
}

export function readSession(value?: string | null): string | null {
  if (!value) return null;
  const [data, sig] = value.split('.');
  if (!data || !sig) return null;
  const good = Buffer.from(sign(data)); const got = Buffer.from(sig);
  if (good.length !== got.length || !timingSafeEqual(good, got)) return null;
  try {
    const { e, x } = JSON.parse(Buffer.from(data, 'base64url').toString());
    return typeof e === 'string' && typeof x === 'number' && x > Date.now() ? e : null;
  } catch { return null; }
}
