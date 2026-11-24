import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabasePublic } from '@/lib/data';
import { COOKIE, readSession } from '@/lib/account';

export const dynamic = 'force-dynamic';

export async function GET() {
  const email = readSession((await cookies()).get(COOKIE)?.value);
  if (!email) return NextResponse.json({ email: null }, { headers: { 'Cache-Control': 'no-store' } });
  const { data, error } = await supabasePublic!.rpc('account_orders', { p_secret: process.env.ORDER_SECRET, p_email: email });
  if (error) { console.error('account_orders', error); return NextResponse.json({ error: 'No hemos podido cargar tus pedidos.' }, { status: 500 }); }
  return NextResponse.json({ email, orders: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}
