import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProduct, getProducts } from '@/lib/data';
import { formatEUR } from '@/lib/config';
import Gallery from '@/components/Gallery';
import AddToCart from '@/components/AddToCart';
import ProductCard from '@/components/ProductCard';

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  const desc = (p.short_description || p.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 155);
  return { title: p.name, description: desc, openGraph: { images: p.images.slice(0, 1) } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const related = (await getProducts()).filter((p) => p.slug !== slug && p.category === product.category).slice(0, 3);
  const cat = product.category ? product.category.charAt(0) + product.category.slice(1).toLowerCase() : null;
  return (
    <section className="page-section product-page">
      <nav className="breadcrumb" aria-label="Migas de pan">
        <a href="/">Inicio</a> / {cat && <><a href={`/productos/?cat=${encodeURIComponent(product.category!)}`}>{cat}</a> / </>}<span>{product.name}</span>
      </nav>
      <div className="product-layout">
        <Gallery images={product.images} name={product.name} />
        <div className="product-info">
          <h1>{product.name}</h1>
          <p className="price big">{formatEUR(product.price_cents)}</p>
          <p className="tax-note">IVA incluido</p>
          {product.short_description && <div className="rich" dangerouslySetInnerHTML={{ __html: product.short_description }} />}
          <AddToCart product={product} withQty />
          {cat && <p className="meta">Categoría: {cat}</p>}
        </div>
      </div>
      {product.description && (
        <div className="product-description">
          <h2>Descripción</h2>
          <div className="rich" dangerouslySetInnerHTML={{ __html: product.description }} />
        </div>
      )}
      {related.length > 0 && (
        <div className="related">
          <h2 className="section-title small">PRODUCTOS RELACIONADOS</h2>
          <ul className="product-grid">{related.map((p) => <ProductCard key={p.slug} product={p} />)}</ul>
        </div>
      )}
    </section>
  );
}
