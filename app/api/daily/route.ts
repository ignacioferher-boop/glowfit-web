import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/data';
import { reviewRequestEmail, sendEmail } from '@/lib/email';
import { reviewUrl } from '@/lib/reviews';
import { allow } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Tareas diarias (Vercel lo lanza cada mañana): pide opinión a quien recibió su pedido hace 7 días.
// Solo actúa una vez al día aunque alguien llame a esta dirección.
export async function GET(req: Request) {
  const secret = process.env.ORDER_SECRET;
  if (!secret || !supabasePublic) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const cron = process.env.CRON_SECRET && req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
  if (!cron && !(await allow('daily:tasks', 1, 20 * 3600))) return NextResponse.json({ ok: true, skipped: true });
  const { data, error } = await supabasePublic.rpc('due_review_emails', { p_secret: secret });
  if (error) { console.error('due_review_emails', error.message); return NextResponse.json({ error: 'db' }, { status: 500 }); }
  let sent = 0;
  for (const o of (data ?? []) as { id: string; order_number: number; name: string; email: string; items: { name: string; qty: number; total_cents: number }[] }[]) {
    if (!o.email) continue;
    const ok = await sendEmail(o.email, reviewRequestEmail({ name: o.name, order_number: o.order_number, url: reviewUrl(o.id), items: o.items ?? [] }), process.env.ORDER_NOTIFY_EMAIL);
    if (ok) { sent++; await supabasePublic.rpc('mark_review_emailed', { p_secret: secret, p_order: o.id }); }
  }
  return NextResponse.json({ ok: true, review_emails: sent });
}
