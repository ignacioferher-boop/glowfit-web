import type { ShopProduct } from '@/lib/shop';
import AddToCart from './AddToCart';
import { Price } from './currency';
import { guideGiftActive } from '@/lib/guide-gift';
import { BfRibbon } from './GiftGuide';

export default function ProductCard({ product }: { product: ShopProduct }) {
  const href = `/producto/${product.slug}/`;
  const save = product.compareAtCents ? product.compareAtCents - product.price_cents : 0;
  const bf = guideGiftActive() && product.available !== 0;
  return (
    <li className={`product-card${product.available === 0 ? ' is-out' : ''}${bf ? ' has-bf' : ''}`}>
      <a href={href} className="product-img" tabIndex={-1} aria-hidden="true">
        <img src={product.images[0]} alt="" loading="lazy" />
        {bf && <BfRibbon pack={product.slug === 'pack-black-friday'} />}
        {product.available === 0 && <span className="card-badge out">Agotado</span>}
        {product.available !== 0 && product.stock_label && <span className="card-badge low">{product.stock_label.replace(/!$/, '').replace(/^¡/, '')}</span>}
        {product.available !== 0 && product.slug === 'pack-black-friday' && <span className="card-badge bf">{bf ? 'Ahorra ' : 'BLACK FRIDAY · Ahorra '}<Price cents={save} /></span>}
        {product.available !== 0 && product.slug !== 'pack-black-friday' && !product.stock_label && save > 0 && <span className="card-badge save">Ahorra <Price cents={save} /></span>}
        {product.available !== 0 && !product.stock_label && !save && product.badge && <span className="card-badge">{product.badge}</span>}
      </a>
      <div className="card-body">
        {product.catLabel && <p className="kiona card-cat">{product.catLabel.toUpperCase()}</p>}
        <h3><a href={href}>{product.name}</a></h3>
        {product.tagline && <p className="card-tag">{product.tagline}</p>}
        <p className="card-price">
          <Price className="price" cents={product.price_cents} />
          {product.compareAtCents && <s><Price cents={product.compareAtCents} /></s>}
        </p>
        <AddToCart product={product} />
      </div>
    </li>
  );
}
