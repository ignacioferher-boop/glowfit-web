import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/data';
import { buildBackup, backupName, type BackupData } from '@/lib/backup';
import { backupEmail, sendEmail } from '@/lib/email';
import { allow } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Copia de seguridad diaria: Vercel la lanza cada mañana y envía el Excel al email de la tienda.
// Aunque alguien llamara a esta dirección, solo se envía al buzón de la tienda y como mucho una vez al día.
export async function GET(req: Request) {
  const secret = process.env.ORDER_SECRET;
  const to = process.env.ORDER_NOTIFY_EMAIL;
  if (!secret || !to || !supabasePublic) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const cron = process.env.CRON_SECRET && req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
  if (!cron && !(await allow('backup:daily', 1, 20 * 3600))) return NextResponse.json({ ok: true, skipped: true });
  const { data, error } = await supabasePublic.rpc('backup_export', { p_secret: secret });
  if (error || !data) { console.error('backup_export', error?.message); return NextResponse.json({ error: 'db' }, { status: 500 }); }
  const d = data as BackupData;
  const buf = await buildBackup(d);
  const date = new Date().toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' });
  const ok = await sendEmail(to, { ...backupEmail({ orders: d.orders.length, customers: d.customers.length, messages: d.messages.length }, date), attachments: [{ filename: backupName(), content: Buffer.from(buf).toString('base64') }] });
  return NextResponse.json({ ok });
}
