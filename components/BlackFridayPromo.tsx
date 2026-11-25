import { getProducts } from '@/lib/data';
import { enrich } from '@/lib/shop';
import { Price } from './currency';

export const BF_SLUG = 'pack-black-friday';

// Franja de la oferta Black Friday. Solo aparece si el pack está activo en el panel.
export default async function BlackFridayPromo({ exclude }: { exclude?: string }) {
  if (exclude === BF_SLUG) return null;
  const p = enrich(await getProducts()).find((x) => x.slug === BF_SLUG);
  if (!p || p.available === 0) return null;
  const href = `/producto/${BF_SLUG}/`;
  return (
    <aside className="bf-promo" aria-label="Oferta Black Friday">
      <a href={href} className="bf-img" tabIndex={-1} aria-hidden="true"><img src={p.images[0]} alt="" /></a>
      <div className="bf-text">
        <p className="kiona bf-eyebrow">OFERTA BLACK FRIDAY</p>
        <p className="bf-title">{p.includes.length ? p.includes.map((i) => i.name).join(' + ') : p.name}</p>
        <p className="bf-price"><Price cents={p.price_cents} />{p.compareAtCents && <> <s><Price cents={p.compareAtCents} /></s> <small>por separado</small></>}</p>
      </div>
      <a href={href} className="btn bf-btn">Ver la oferta</a>
    </aside>
  );
}
