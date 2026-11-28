import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/data';
import { followupEmail, reviewRequestEmail, sendEmail } from '@/lib/email';
import { guideGiftActive, guideUrl } from '@/lib/guide';
import { followupStopUrl, followupText, followupUrl } from '@/lib/followup';
import { reviewUrl } from '@/lib/reviews';
import { allow } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Tareas diarias (Vercel lo lanza cada mañana): pide opinión a quien recibió su pedido hace 7 días
// y envía los mensajes de seguimiento (días 5, 15 y 28 desde la compra).
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
  // Seguimiento tras la compra. Si algo falla aquí, no afecta a lo anterior.
  let followups = 0;
  const { data: due, error: fErr } = await supabasePublic.rpc('due_followups', { p_secret: secret });
  if (fErr) console.error('due_followups', fErr.message);
  for (const o of (due ?? []) as { id: string; order_number: number; created_at?: string; name: string; email: string; step: number }[]) {
    if (!o.email || o.step < 1 || o.step > 3) continue;
    const t = followupText(o.step, o.name);
    // Primero se guarda (evita enviar dos veces el mismo paso); si el email falla, se borra la marca.
    const { data: logged } = await supabasePublic.rpc('log_followup', { p_secret: secret, p_order: o.id, p_step: o.step, p_subject: t.subject, p_body: t.body });
    if (logged !== true) continue;
    const ok = await sendEmail(o.email, followupEmail({ ...t, step: o.step, url: followupUrl(o.id), stopUrl: followupStopUrl(o.id), guideUrl: o.step === 1 && guideGiftActive(new Date(Date.now() - 5 * 86400000)) ? guideUrl(o.order_number) : null }), process.env.ORDER_NOTIFY_EMAIL);
    if (ok) followups++;
    else await supabasePublic.rpc('unlog_followup', { p_secret: secret, p_order: o.id, p_step: o.step });
  }
  return NextResponse.json({ ok: true, review_emails: sent, followups });
}
