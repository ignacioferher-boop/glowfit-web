import type { Product } from './types';

// Texto corto bajo el nombre (para qué sirve) y composición de packs.
const EXTRA: Record<string, { tagline: string; badge?: string; includes?: string[] }> = {
  glow: { tagline: 'Quemagrasas termogénico: activa el metabolismo y te ayuda a controlar tu peso.', badge: 'Favorito' },
  bloom: { tagline: 'Drenante: ayuda a eliminar líquidos retenidos, hinchazón y pesadez.' },
  'curcuma-y-curcumina': { tagline: 'Para mejores digestiones y una piel más luminosa. Con 95 % de curcumina.' },
  'pack-glowxpro-bloom': { tagline: 'Quemagrasas + drenante: control de peso y menos hinchazón.', includes: ['glow', 'bloom'] },
  'pack-silueta-perfecta': { tagline: 'Rutina completa: quema grasa, drena líquidos y mejora tus digestiones.', includes: ['glow', 'bloom', 'curcuma-y-curcumina'] },
};

export type ShopProduct = Product & {
  tagline: string | null;
  badge: string | null;
  includes: Product[];
  compareAtCents: number | null;
  catLabel: string | null;
};

export const catLabel = (c: string | null) => (c ? c.charAt(0).toUpperCase() + c.slice(1).toLowerCase() : null);

export function enrich(products: Product[]): ShopProduct[] {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  return products.map((p) => {
    const x = EXTRA[p.slug];
    const includes = (x?.includes ?? []).map((s) => bySlug.get(s)).filter(Boolean) as Product[];
    const sum = includes.reduce((n, i) => n + i.price_cents, 0);
    const compareAtCents = includes.length && sum > p.price_cents ? sum : null;
    const fallback = (p.short_description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(/(?<=[.?!])\s/)[0] || null;
    return {
      ...p,
      tagline: x?.tagline ?? fallback,
      badge: compareAtCents ? null : x?.badge ?? null,
      includes,
      compareAtCents,
      catLabel: catLabel(p.category),
    };
  });
}
