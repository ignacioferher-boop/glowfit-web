import { NextResponse } from 'next/server';
import { adminFromRequest } from '@/lib/admin-auth';
import { grantAppAccess } from '@/lib/app-access';

// Panel: dar acceso a la app a un email (o reenviar su código).
export async function POST(req: Request) {
  const db = await adminFromRequest(req);
  if (!db) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Escribe un email válido.' }, { status: 400 });
  const r = await grantAppAccess({ email, name: String(b.name || '').trim() || null, source: b.resend ? undefined : 'manual', guide: b.guide !== false, forceEmail: true });
  if (!r.ok) return NextResponse.json({ error: 'No se pudo dar el acceso. Inténtalo de nuevo.' }, { status: 500 });
  return NextResponse.json({ ok: true, emailed: r.emailed, code: r.member.code });
}
