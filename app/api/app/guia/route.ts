import { readFile } from 'fs/promises';
import path from 'path';
import type { NextRequest } from 'next/server';
import { supabasePublic } from '@/lib/data';
import { APP_COOKIE, memberFromCookie } from '@/lib/app-access';

export const dynamic = 'force-dynamic';

// Guía PDF dentro de la app: solo para clientes con acceso a la guía (compraron un producto o la guía).
export async function GET(req: NextRequest) {
  const id = memberFromCookie(req.cookies.get(APP_COOKIE)?.value);
  const deny = (t: string) => new Response(t, { status: 403, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  if (!id || !supabasePublic) return deny('Entra en la app con tu código para ver la guía.');
  const { data } = await supabasePublic.rpc('app_ping', { p_secret: process.env.ORDER_SECRET, p_id: id, p_standalone: false, p_platform: null });
  const m = (Array.isArray(data) ? data[0] : data) as { has_guide: boolean; revoked: boolean } | null;
  if (!m || m.revoked || !m.has_guide) return deny('Tu acceso no incluye la guía.');
  const file = await readFile(path.join(process.cwd(), 'private', 'guia.pdf'));
  return new Response(new Uint8Array(file), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'inline; filename="Glowfit-Guia-Tu-momento-cada-dia.pdf"',
      'cache-control': 'private, max-age=3600',
      'x-robots-tag': 'noindex',
    },
  });
}
