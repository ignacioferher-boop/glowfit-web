import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Estado de la configuración (solo sí/no, nunca valores) para comprobar que los pagos están conectados.
export function GET() {
  const sk = (process.env.STRIPE_SECRET_KEY || '').trim();
  const wh = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  return NextResponse.json({
    stripe_key: sk ? (sk.startsWith('sk_live_') ? 'live' : sk.startsWith('sk_test_') ? 'test' : sk.startsWith('rk_') ? 'restricted' : 'formato raro') : 'falta',
    webhook_secret: wh ? (wh.startsWith('whsec_') ? 'ok' : 'formato raro') : 'falta',
    order_secret: !!process.env.ORDER_SECRET,
    email: !!process.env.RESEND_API_KEY,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
