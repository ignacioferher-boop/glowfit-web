// Fecha fin del regalo de la guía (hora de Madrid). Se usa en la web y en el email de pedido.
export const GUIDE_GIFT_UNTIL = process.env.NEXT_PUBLIC_GUIDE_GIFT_UNTIL || '2026-12-01T23:59:59+01:00';
export const guideGiftActive = (d = new Date()) => d.getTime() <= new Date(GUIDE_GIFT_UNTIL).getTime();
