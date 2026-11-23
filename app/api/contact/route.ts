import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/data';
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (b.website) return NextResponse.json({ ok: true }); // trampa anti-spam
  const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const row = { name: `${s(b.first_name, 80)} ${s(b.last_name, 120)}`.trim(), email: s(b.email, 200), phone: s(b.phone, 40), message: s(b.message, 4000) };
  if (!row.name || !row.email.includes('@') || !row.message) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  const { error } = await supabasePublic!.from('contact_messages').insert(row);
  if (error) { console.error(error); return NextResponse.json({ error: 'db' }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
