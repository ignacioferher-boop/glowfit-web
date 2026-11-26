import { NextResponse } from 'next/server';
import { adminFromRequest } from '@/lib/admin-auth';
import { notifyAdmins } from '@/lib/push';

// Notificación de prueba al activar los avisos en el panel
export async function POST(req: Request) {
  if (!(await adminFromRequest(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const sent = await notifyAdmins({ title: 'Glowfit · Notificaciones activadas ✅', body: 'Así te avisaremos de cada pedido nuevo y de los mensajes de tus clientes.', tag: 'test' });
  return NextResponse.json({ ok: true, sent });
}
