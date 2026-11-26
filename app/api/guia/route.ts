import { readFile } from 'fs/promises';
import path from 'path';
import { validGuideToken } from '@/lib/guide';

export const dynamic = 'force-dynamic';

// Descarga de la guía PDF con el enlace personal del email de pedido.
export async function GET(req: Request) {
  const u = new URL(req.url);
  if (!validGuideToken(u.searchParams.get('n') || '', u.searchParams.get('t') || '')) {
    return new Response('Enlace no válido. Usa el enlace del email de tu pedido o escríbenos y te lo reenviamos.', { status: 403, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
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
