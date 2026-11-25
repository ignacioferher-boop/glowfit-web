import { supabasePublic } from './data';

// IP real del visitante detrás de Vercel
export function clientIp(req: Request) {
  const h = req.headers;
  return (h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0] || 'unknown').trim().slice(0, 64);
}

/**
 * Límite de peticiones por clave (IP, email…) guardado en la base de datos,
 * así funciona igual aunque Vercel use varias instancias.
 * Devuelve true si se permite. Si la función aún no existe en la base de datos, no bloquea.
 */
export async function allow(key: string, max: number, windowSeconds: number) {
  const secret = process.env.ORDER_SECRET;
  if (!secret || !supabasePublic) return true;
  const { data, error } = await supabasePublic.rpc('rate_limit', { p_secret: secret, p_key: key, p_max: max, p_window_seconds: windowSeconds });
  if (error) { if (error.code !== 'PGRST202') console.error('rate_limit', error.message); return true; }
  return data !== false;
}

export const tooMany = (msg = 'Has hecho demasiados intentos. Espera unos minutos y vuelve a intentarlo.') =>
  Response.json({ error: msg }, { status: 429 });
