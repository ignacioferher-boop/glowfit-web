import type { ShopProduct } from '@/lib/shop';
import { formatEUR } from '@/lib/config';
import AddToCart from './AddToCart';

export default function ProductCard({ product }: { product: ShopProduct }) {
  const href = `/producto/${product.slug}/`;
  const save = product.compareAtCents ? product.compareAtCents - product.price_cents : 0;
  return (
    <li className="product-card">
      <a href={href} className="product-img" tabIndex={-1} aria-hidden="true">
        <img src={product.images[0]} alt="" loading="lazy" />
        {save > 0 && <span className="card-badge save">Ahorra {formatEUR(save)}</span>}
        {product.badge && <span className="card-badge">{product.badge}</span>}
      </a>
      <div className="card-body">
        {product.catLabel && <p className="kiona card-cat">{product.catLabel.toUpperCase()}</p>}
        <h3><a href={href}>{product.name}</a></h3>
        {product.tagline && <p className="card-tag">{product.tagline}</p>}
        <p className="card-price">
          <span className="price">{formatEUR(product.price_cents)}</span>
          {product.compareAtCents && <s aria-label={`Antes ${formatEUR(product.compareAtCents)}`}>{formatEUR(product.compareAtCents)}</s>}
        </p>
        <AddToCart product={product} />
      </div>
    </li>
  );
}
