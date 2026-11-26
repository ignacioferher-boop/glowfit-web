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
  /** Aviso cuando el carrito se ha ajustado (producto retirado, agotado o con menos unidades) */
  notice: string | null;
  sync: () => Promise<void>;
};
const CartContext = createContext<Ctx | null>(null);
const KEY = 'glowfit-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Compara el carrito guardado con la tienda: quita lo que ya no se vende o está agotado,
  // baja cantidades si quedan menos unidades y actualiza precios.
  const sync = async () => {
    let live: { slug: string; name: string; price_cents: number; available: number | null }[];
    try {
      const r = await fetch('/api/cart/', { cache: 'no-store' });
      if (!r.ok) return;
      live = await r.json();
    } catch { return; }
    const bySlug = new Map(live.map((p) => [p.slug, p]));
    setItems((prev) => {
      const msgs: string[] = [];
      const next = prev.flatMap((i) => {
        const p = bySlug.get(i.slug);
        if (!p) { msgs.push(`${i.name} ya no está disponible y lo hemos quitado del carrito.`); return []; }
        if (p.available === 0) { msgs.push(`${p.name} se ha agotado y lo hemos quitado del carrito.`); return []; }
        let qty = i.qty;
        if (p.available !== null && qty > p.available) { qty = p.available; msgs.push(`Solo quedan ${p.available} de ${p.name}: hemos ajustado la cantidad.`); }
        return [{ ...i, name: p.name, price_cents: p.price_cents, qty }];
      });
      if (msgs.length) setNotice(msgs.join(' '));
      return msgs.length || next.some((n, k) => n.price_cents !== prev[k]?.price_cents) ? next : prev;
    });
  };

  useEffect(() => {
    let has = false;
    try { const raw = localStorage.getItem(KEY); if (raw) { const v = JSON.parse(raw); has = Array.isArray(v) && v.length > 0; setItems(v); } } catch {}
    setLoaded(true);
    if (has) sync();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
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
  // Borra también lo guardado al momento (si no, al recargar la página volvería el carrito antiguo)
  const clear = () => { try { localStorage.removeItem(KEY); } catch {} setItems([]); setNotice(null); };
  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((n, i) => n + i.qty * i.price_cents, 0);

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, count, subtotal, justAdded, notice, sync }}>
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
