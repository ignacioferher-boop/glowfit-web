import { createHmac, timingSafeEqual } from 'crypto';

// Guía PDF "Tu momento, cada día": regalo con cada pedido hecho hasta GUIDE_GIFT_UNTIL (semana de Black Friday).
// Para alargar o acortar la promoción, cambia esta fecha (hora de Madrid). Los enlaces ya enviados siguen funcionando.
// La fecha está en lib/guide-gift.ts.
export { guideGiftActive } from './guide-gift';

const key = () => process.env.ORDER_SECRET || '';
export const guideToken = (orderNumber: number | string) => createHmac('sha256', key()).update(`guide:${orderNumber}`).digest('base64url').slice(0, 24);
export function validGuideToken(n: string, t: string) {
  if (!key() || !/^\d{1,9}$/.test(n) || !t) return false;
  const a = Buffer.from(guideToken(n)); const b = Buffer.from(String(t));
  return a.length === b.length && timingSafeEqual(a, b);
}
// Enlace personal de descarga (solo quien tiene el email del pedido)
export const guideUrl = (orderNumber: number) => `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://glowfit.group').replace(/\/$/, '')}/api/guia/?n=${orderNumber}&t=${guideToken(orderNumber)}`;
