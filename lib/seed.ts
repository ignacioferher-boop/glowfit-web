// Copia local mínima del catálogo, solo se usa si Supabase no está configurado (desarrollo).
import type { Product } from './types';
const M = 'https://vwyvmqsxiazcrhjdiucm.supabase.co/storage/v1/object/public/media/uploads';
const p = (sort: number, slug: string, name: string, category: string, price_cents: number, images: string[], description: string): Product => ({
  id: slug, slug, name, category, price_cents, sort, images: images.map((i) => `${M}/${i}`),
  short_description: `<p>${description}</p>`, description: `<p>${description}</p>`,
});
export const SEED_PRODUCTS: Product[] = [
  p(1, 'glow', 'GlowXpro', 'Vitaminas', 2990, ['2026/10/glow-xpro.png', '2026/05/GLOWXPRO.png', '2026/05/indicaciones-xpro.png', '2026/05/ingredientes-xpro.png', '2026/10/ALERGENOS-GLOWXPRO.png'], 'Contenido 90 cápsulas vegetales.'),
  p(2, 'bloom', 'Bloom', 'Vitaminas', 2990, ['2026/10/bloom.png', '2026/05/BLOOM.png', '2026/05/indicaciones-bloom.png', '2026/05/INGRDIENTES-BLOOM-2.png', '2026/10/ALERGENOS-BLOOM.png'], 'Contenido 100 cápsulas vegetales.'),
  p(3, 'curcuma-y-curcumina', 'Cúrcuma y Curcumina', 'Vitaminas', 2990, ['2026/10/curcuma.png', '2026/05/CURCUMA.png', '2026/05/indicaciones-curcuma.png', '2026/05/ingredientes-curcum.png', '2026/10/ALERGENOS-CURCUMA-Y-CURCUMINA.png'], 'Contenido 60 cápsulas vegetales.'),
  p(4, 'pack-glowxpro-bloom', 'Pack Quema Grasa', 'PACKS', 5490, ['2026/10/PACK-GLOWXPRO-BLOOM.png'], 'GLOWXPRO + BLOOM'),
  p(5, 'pack-silueta-perfecta', 'Pack Silueta Verano', 'PACKS', 7490, ['2026/10/PACK-SILUETA-PERFECTA.png'], 'GLOWXPRO · BLOOM · CÚRCUMA Y CURCUMINA'),
];
