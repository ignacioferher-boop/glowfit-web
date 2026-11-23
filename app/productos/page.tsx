import { getProducts } from '@/lib/data';
import ProductCard from '@/components/ProductCard';
export const revalidate = 300;
export const metadata = { title: 'Productos' };

export default async function Productos({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const all = await getProducts();
  const cats = [...new Set(all.map((p) => p.category).filter(Boolean))] as string[];
  const products = cat ? all.filter((p) => p.category?.toLowerCase() === cat.toLowerCase()) : all;
  return (
    <section className="page-section">
      <h1 className="section-title">PRODUCTOS</h1>
      <nav className="cat-filter" aria-label="Categorías">
        <a href="/productos/" className={!cat ? 'active' : ''}>Todos</a>
        {cats.map((c) => <a key={c} href={`/productos/?cat=${encodeURIComponent(c)}`} className={cat?.toLowerCase() === c.toLowerCase() ? 'active' : ''}>{c.charAt(0) + c.slice(1).toLowerCase()}</a>)}
      </nav>
      <ul className="product-grid">{products.map((p) => <ProductCard key={p.slug} product={p} />)}</ul>
    </section>
  );
}
