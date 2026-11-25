import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/data';
import { allow, clientIp, tooMany } from '@/lib/ratelimit';

// Seguimiento de pedido (número + email), con límite de intentos para que nadie pueda ir probando números.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const n = Number(String(b.number ?? '').replace(/[^0-9]/g, ''));
  const email = String(b.email ?? '').trim().toLowerCase().slice(0, 200);
  if (!n || n > 2_000_000_000 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Escribe tu número de pedido y el email con el que compraste.' }, { status: 400 });
  if (!(await allow(`lookup:ip:${clientIp(req)}`, 10, 900))) return tooMany();
  const secret = process.env.ORDER_SECRET;
  let { data, error } = await supabasePublic!.rpc('lookup_order_secure', { p_secret: secret, p_number: n, p_email: email });
  if (error?.code === 'PGRST202') ({ data, error } = await supabasePublic!.rpc('lookup_order', { p_number: n, p_email: email }));
  if (error) console.error('lookup_order', error.message);
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return NextResponse.json({ error: 'No encontramos ningún pedido con esos datos. Revisa el número (lo tienes en el email de confirmación) y el email.' }, { status: 404 });
  return NextResponse.json({ order: row }, { headers: { 'Cache-Control': 'no-store' } });
}
