// Fin del regalo de la guía (terminó el 28/11/2026 a las 13:00, hora de Madrid). Los pedidos hechos antes la recibieron en la app.
// Desde entonces la guía se vende como producto digital (4,99 €).
export const GUIDE_GIFT_UNTIL = process.env.NEXT_PUBLIC_GUIDE_GIFT_UNTIL || '2026-11-28T13:00:00+01:00';
export const guideGiftActive = (d = new Date()) => d.getTime() <= new Date(GUIDE_GIFT_UNTIL).getTime();
