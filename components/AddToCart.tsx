'use client';
import { useState } from 'react';
import { useCart } from './cart';
import type { Product } from '@/lib/types';

export default function AddToCart({ product, withQty = false }: { product: Product; withQty?: boolean }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const item = { slug: product.slug, name: product.name, price_cents: product.price_cents, image: product.images[0] ?? '' };
  return (
    <div className="add-to-cart">
      {withQty && (
        <label className="qty">
          <span className="sr-only">Cantidad de {product.name}</span>
          <input type="number" min={1} max={20} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} />
        </label>
      )}
      <button className="btn btn-small" onClick={() => add(item, qty)}>Añadir al carrito</button>
    </div>
  );
}
