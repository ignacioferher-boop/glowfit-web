// Productos digitales: no llevan envío ni dirección y se entregan al momento por email (y en la app).
export const GUIDE_SLUG = 'guia-tu-momento-cada-dia';
export const DIGITAL_SLUGS = new Set([GUIDE_SLUG]);
export const isDigital = (slug: string) => DIGITAL_SLUGS.has(slug);
export const allDigital = (slugs: string[]) => slugs.length > 0 && slugs.every(isDigital);
