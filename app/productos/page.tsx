import { getProducts } from '@/lib/data';
import { media } from '@/lib/config';
import { enrich } from '@/lib/shop';
import ProductCard from '@/components/ProductCard';
import TrustBar from '@/components/TrustBar';
export const revalidate = 300;
export const metadata = { title: 'Productos', description: 'Suplementos Glowfit: vitaminas y packs para tu rutina de bienestar. Envío a toda España.' };

export default async function Productos({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const all = enrich(await getProducts());
  const cats = [...new Set(all.map((p) => p.category).filter(Boolean))] as string[];
  const products = cat ? all.filter((p) => p.category?.toLowerCase() === cat.toLowerCase()) : all;
  const label = (c: string) => c.charAt(0) + c.slice(1).toLowerCase();
  return (
    <>
      <header className="shop-hero" style={{ backgroundImage: `url(${media('2026/05/FONDO-COLOR-scaled.png')})` }}>
        <p className="kiona legal-eyebrow">TIENDA GLOWFIT</p>
        <h1 className="section-title">PRODUCTOS</h1>
        <img className="brillo center" src={media('2026/05/BRILLO-LINEA.png')} alt="" />
        <p className="shop-sub">Fórmulas que te acompañan por dentro y se reflejan por fuera.</p>
      </header>
      <div className="trust-band"><TrustBar /></div>
      <section className="page-section shop">
        <div className="shop-bar">
          <nav className="cat-filter" aria-label="Categorías">
            <a href="/productos/" className={!cat ? 'active' : ''} aria-current={!cat ? 'page' : undefined}>Todos <span>{all.length}</span></a>
            {cats.map((c) => {
              const on = cat?.toLowerCase() === c.toLowerCase();
              return <a key={c} href={`/productos/?cat=${encodeURIComponent(c)}`} className={on ? 'active' : ''} aria-current={on ? 'page' : undefined}>{label(c)} <span>{all.filter((p) => p.category === c).length}</span></a>;
            })}
          </nav>
          <p className="shop-count">{products.length} {products.length === 1 ? 'producto' : 'productos'}</p>
        </div>
        {products.length ? (
          <ul className="product-grid">{products.map((p) => <ProductCard key={p.slug} product={p} />)}</ul>
        ) : (
          <div className="empty"><p>No hay productos en esta categoría.</p><a className="btn" href="/productos/">Ver todos los productos</a></div>
        )}
      </section>
    </>
  );
}
