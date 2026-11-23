'use client';
import { useCart } from './cart';
export default function CartIcon() {
  const { count } = useCart();
  return (
    <a href="/carrito/" className="cart-icon" aria-label={`Carrito, ${count} productos`}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6" /><circle cx="9.5" cy="20" r="1.3" /><circle cx="17" cy="20" r="1.3" />
      </svg>
      <span className="badge">{count}</span>
    </a>
  );
}
