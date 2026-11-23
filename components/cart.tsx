'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type CartItem = { slug: string; name: string; price_cents: number; image: string; qty: number };
type Ctx = {
  items: CartItem[];
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  justAdded: string | null;
};
const CartContext = createContext<Ctx | null>(null);
const KEY = 'glowfit-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setItems(JSON.parse(raw)); } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {} }, [items, loaded]);

  const add: Ctx['add'] = (item, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.slug === item.slug);
      if (found) return prev.map((i) => (i.slug === item.slug ? { ...i, qty: Math.min(i.qty + qty, 20) } : i));
      return [...prev, { ...item, qty }];
    });
    setJustAdded(item.name);
    setTimeout(() => setJustAdded(null), 2500);
  };
  const setQty = (slug: string, qty: number) =>
    setItems((prev) => prev.flatMap((i) => (i.slug !== slug ? [i] : qty <= 0 ? [] : [{ ...i, qty: Math.min(qty, 20) }])));
  const remove = (slug: string) => setItems((prev) => prev.filter((i) => i.slug !== slug));
  const clear = () => setItems([]);
  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((n, i) => n + i.qty * i.price_cents, 0);

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, count, subtotal, justAdded }}>
      {children}
      {justAdded && <div className="toast" role="status">✓ {justAdded} añadido al carrito · <a href="/carrito/">Ver carrito</a></div>}
    </CartContext.Provider>
  );
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error('useCart fuera de CartProvider');
  return c;
}
