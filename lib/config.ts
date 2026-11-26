// Ajustes de la tienda. Los marcados PENDIENTE CLIENTE hay que confirmarlos.
export const SITE = {
  name: 'Glowfit',
  tagline: 'Bienestar · Belleza · Hábitos',
  // PENDIENTE CLIENTE: número de WhatsApp en formato internacional sin "+" (ej. 34600000000)
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '34722406293',
  // PENDIENTE CLIENTE: email público de contacto
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@glowfit.group',
};

export const SHIPPING = {
  // PENDIENTE CLIENTE: precio de envío estándar a España (en céntimos)
  standardCents: Number(process.env.SHIPPING_STANDARD_CENTS || 495),
  // Envío gratis a partir de este subtotal (en céntimos). 0 = nunca gratis (decisión 2026-11-25)
  freeFromCents: Number(process.env.SHIPPING_FREE_FROM_CENTS || 0),
  // PENDIENTE CLIENTE: plazo de entrega en días laborables
  minDays: 2,
  maxDays: 4,
};

export const MEDIA_BASE =
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vwyvmqsxiazcrhjdiucm.supabase.co') +
  '/storage/v1/object/public/media/uploads';

export const media = (path: string) => `${MEDIA_BASE}/${path}`;

export const formatEUR = (cents: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);

// Producto TEMPORAL para la compra real de prueba de 1 €: si el carrito solo lleva este producto, no se cobra envío.
export const TEST_PRODUCT_SLUG = 'prueba-1-euro';
export const onlyTestProduct = (slugs: string[]) => slugs.length > 0 && slugs.every((s) => s === TEST_PRODUCT_SLUG);
