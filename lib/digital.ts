// Productos digitales: no llevan envío ni dirección y se entregan al momento por email (y en la app).
export const GUIDE_SLUG = 'guia-tu-momento-cada-dia';
export const DIGITAL_SLUGS = new Set([GUIDE_SLUG]);
export const isDigital = (slug: string) => DIGITAL_SLUGS.has(slug);
export const allDigital = (slugs: string[]) => slugs.length > 0 && slugs.every(isDigital);

// Productos sin gastos de envío (producto de prueba de 1 €). Quitar el slug de aquí cuando se borre el producto.
export const FREE_SHIPPING_SLUGS = new Set(['prueba-1-euro']);
export const isFreeShipping = (slug: string) => FREE_SHIPPING_SLUGS.has(slug);
