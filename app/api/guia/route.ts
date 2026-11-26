import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// La guía ya no se descarga desde el email: solo dentro de la app Glowfit instalada.
// Los enlaces antiguos llevan a la app.
export async function GET(req: Request) {
  return NextResponse.redirect(new URL('/app/', req.url), 302);
}
