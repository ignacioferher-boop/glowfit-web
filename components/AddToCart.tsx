'use client';
import { useEffect, useState } from 'react';
import { useCart } from './cart';
import type { Product } from '@/lib/types';

export default function AddToCart({ product, withQty = false }: { product: Product; withQty?: boolean }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);
  useEffect(() => { if (!done) return; const t = setTimeout(() => setDone(false), 1800); return () => clearTimeout(t); }, [done]);
  const avail = product.available ?? null;
  const soldOut = avail !== null && avail <= 0;
  const max = Math.max(1, Math.min(20, avail ?? 20));
  const low = avail !== null && avail > 0 && avail <= 5;
  const item = { slug: product.slug, name: product.name, price_cents: product.price_cents, image: product.images[0] ?? '' };
  return (
    <div className={`add-to-cart${withQty ? ' with-qty' : ''}`}>
      {withQty && (
        <div className="stepper" role="group" aria-label={`Cantidad de ${product.name}`}>
          <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="Quitar una unidad">−</button>
          <span aria-live="polite">{qty}</span>
          <button type="button" onClick={() => setQty(Math.min(max, qty + 1))} disabled={soldOut || qty >= max} aria-label="Añadir una unidad">+</button>
        </div>
      )}
      {soldOut ? (
        <button type="button" className="btn btn-add sold-out" disabled>Agotado</button>
      ) : (
        <button type="button" className={`btn btn-add${done ? ' done' : ''}`} onClick={() => { add(item, Math.min(qty, max)); setDone(true); }}>
          {done ? '✓ Añadido' : 'Añadir al carrito'}
        </button>
      )}
      {withQty && low && <p className="stock-low">¡Quedan solo {avail}!</p>}
      {withQty && soldOut && <p className="stock-out">Lo estamos reponiendo. Escríbenos por WhatsApp y te avisamos cuando vuelva.</p>}
    </div>
  );
}
