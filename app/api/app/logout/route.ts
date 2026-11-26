import { NextResponse } from 'next/server';
import { APP_COOKIE } from '@/lib/app-access';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(APP_COOKIE);
  return res;
}
