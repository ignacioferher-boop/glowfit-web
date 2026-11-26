import { NextResponse } from 'next/server';
import { endBlackFriday } from '@/lib/black-friday-end';

export const dynamic = 'force-dynamic';

// Lo lanza Vercel el 1 de diciembre a las 23:00 UTC (00:00 del 2 de diciembre en Madrid).
export async function GET() {
  return NextResponse.json(await endBlackFriday());
}
