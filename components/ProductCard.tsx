import type { Product } from '@/lib/types';
import { formatEUR } from '@/lib/config';
import AddToCart from './AddToCart';
export default function ProductCard({ product }: { product: Product }) {
  const href = `/producto/${product.slug}/`;
  return (
    <li className="product-card">
      <h3><a href={href}>{product.name}</a></h3>
      <a href={href} className="product-img"><img src={product.images[0]} alt={product.name} loading="lazy" /></a>
      <p className="price">{formatEUR(product.price_cents)}</p>
      <AddToCart product={product} />
    </li>
  );
}
