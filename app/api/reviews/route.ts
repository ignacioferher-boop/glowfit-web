import { NextResponse } from 'next/server';
import { supabasePublic, getProducts } from '@/lib/data';
import { validReviewToken } from '@/lib/reviews';
import { allow, clientIp, tooMany } from '@/lib/ratelimit';

// Guarda una opinión de un cliente que ha comprado (enlace firmado del email). Queda pendiente de aprobar en el panel.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const order = String(b.o || ''); const t = String(b.t || '');
  if (!/^[0-9a-f-]{36}$/i.test(order) || !validReviewToken(order, t)) return NextResponse.json({ error: 'El enlace no es válido. Usa el del email que te enviamos.' }, { status: 403 });
  if (!(await allow(`review:ip:${clientIp(req)}`, 10, 3600))) return tooMany();
  const rating = Math.round(Number(b.rating));
  if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ error: 'Elige de 1 a 5 estrellas.' }, { status: 400 });
  const body = String(b.body || '').trim().slice(0, 2000);
  const title = String(b.title || '').trim().slice(0, 120);
  const name = String(b.name || '').trim().slice(0, 60);
  const secret = process.env.ORDER_SECRET;
  const { data: info } = await supabasePublic!.rpc('review_order_info', { p_secret: secret, p_order: order });
  const row = Array.isArray(info) ? info[0] : null;
  if (!row) return NextResponse.json({ error: 'No encontramos el pedido.' }, { status: 404 });
  if (row.reviewed) return NextResponse.json({ error: 'Ya nos dejaste tu opinión para este pedido. ¡Gracias!' }, { status: 409 });
  const catalog = await getProducts();
  const names = ((row.items ?? []) as { name?: string }[]).map((i) => (i.name || '').toLowerCase());
  const products = catalog.filter((p) => names.includes(p.name.toLowerCase())).map((p) => p.slug);
  const { data, error } = await supabasePublic!.rpc('submit_review', { p_secret: secret, p_order: order, p_rating: rating, p_title: title, p_body: body, p_name: name, p_products: products });
  if (error || data !== true) { if (error) console.error('submit_review', error.message); return NextResponse.json({ error: 'No se pudo guardar tu opinión. Inténtalo de nuevo.' }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
