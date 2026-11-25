import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminFromRequest } from '@/lib/admin-auth';

// Códigos de descuento (se guardan en Stripe y se aplican en el pago). Solo administradores.
const stripe = () => (process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null);
const noStripe = () => NextResponse.json({ error: 'Los descuentos se activan cuando conectemos Stripe.' }, { status: 503 });

type Promo = { id: string; code: string; active: boolean; percent: number | null; amount_cents: number | null; times_redeemed: number; max_redemptions: number | null; expires_at: number | null; first_time: boolean; min_cents: number | null; created: number };
function shape(p: Stripe.PromotionCode): Promo {
  const c = p.promotion && typeof p.promotion.coupon === 'object' ? p.promotion.coupon : null;
  return { id: p.id, code: p.code, active: p.active, percent: c?.percent_off ?? null, amount_cents: c?.amount_off ?? null, times_redeemed: p.times_redeemed, max_redemptions: p.max_redemptions, expires_at: p.expires_at, first_time: !!p.restrictions?.first_time_transaction, min_cents: p.restrictions?.minimum_amount ?? null, created: p.created };
}

export async function GET(req: Request) {
  if (!(await adminFromRequest(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const s = stripe(); if (!s) return noStripe();
  const list = await s.promotionCodes.list({ limit: 100, expand: ['data.promotion.coupon'] });
  return NextResponse.json({ promos: list.data.map(shape) });
}

export async function POST(req: Request) {
  if (!(await adminFromRequest(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const s = stripe(); if (!s) return noStripe();
  const b = await req.json().catch(() => ({}));
  const code = String(b.code || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30);
  const kind = b.kind === 'amount' ? 'amount' : 'percent';
  const value = Number(b.value);
  if (code.length < 3) return NextResponse.json({ error: 'El código debe tener al menos 3 letras o números.' }, { status: 400 });
  if (kind === 'percent' && !(value >= 1 && value <= 90)) return NextResponse.json({ error: 'El porcentaje debe estar entre 1 y 90.' }, { status: 400 });
  if (kind === 'amount' && !(value >= 1 && value <= 500)) return NextResponse.json({ error: 'El descuento debe estar entre 1 € y 500 €.' }, { status: 400 });
  const expires = b.expires ? Math.floor(new Date(`${b.expires}T23:59:59+01:00`).getTime() / 1000) : undefined;
  if (expires && expires < Date.now() / 1000) return NextResponse.json({ error: 'La fecha de fin ya ha pasado.' }, { status: 400 });
  const max = b.max ? Math.max(1, Math.min(100000, Math.floor(Number(b.max)))) : undefined;
  const min = b.min ? Math.round(Number(b.min) * 100) : undefined;
  try {
    const coupon = await s.coupons.create(kind === 'percent' ? { percent_off: value, duration: 'once', name: code } : { amount_off: Math.round(value * 100), currency: 'eur', duration: 'once', name: code });
    const promo = await s.promotionCodes.create({
      promotion: { type: 'coupon', coupon: coupon.id }, code, ...(expires ? { expires_at: expires } : {}), ...(max ? { max_redemptions: max } : {}),
      restrictions: { first_time_transaction: b.first_time === true, ...(min ? { minimum_amount: min, minimum_amount_currency: 'eur' } : {}) },
    });
    return NextResponse.json({ promo: shape({ ...promo, promotion: { type: 'coupon', coupon } } as Stripe.PromotionCode) });
  } catch (e) {
    const msg = (e as { code?: string }).code === 'resource_already_exists' ? 'Ya existe un código con ese nombre.' : 'No se pudo crear el código.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  if (!(await adminFromRequest(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const s = stripe(); if (!s) return noStripe();
  const b = await req.json().catch(() => ({}));
  if (!String(b.id || '').startsWith('promo_')) return NextResponse.json({ error: 'Código no válido' }, { status: 400 });
  const p = await s.promotionCodes.update(b.id, { active: b.active === true, expand: ['promotion.coupon'] });
  return NextResponse.json({ promo: shape(p) });
}
