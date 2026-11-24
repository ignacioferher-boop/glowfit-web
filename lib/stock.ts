import { supabasePublic } from './data';

type Row = { id: string; slug: string; name: string; stock: number | null };
type Comp = { pack_id: string; component_id: string; qty: number };

/**
 * Comprueba si hay botes suficientes para todo el carrito a la vez.
 * Los packs gastan botes de sus productos, así que se suman las necesidades
 * de productos sueltos y packs antes de comparar con el stock.
 * Devuelve un mensaje para el cliente si falta algo, o null si todo está bien.
 */
export async function checkStock(items: { slug: string; qty: number }[]): Promise<string | null> {
  if (!supabasePublic) return null;
  const [{ data: prods, error: e1 }, { data: comps, error: e2 }] = await Promise.all([
    supabasePublic.from('products').select('id,slug,name,stock'),
    supabasePublic.from('product_components').select('pack_id,component_id,qty'),
  ]);
  if (e1 || e2 || !prods) { console.error('checkStock', e1 || e2); return null; }
  const rows = prods as Row[];
  const byId = new Map(rows.map((p) => [p.id, p]));
  const bySlug = new Map(rows.map((p) => [p.slug, p]));
  const need = new Map<string, number>();
  const usedBy = new Map<string, Set<string>>();
  for (const it of items) {
    const p = bySlug.get(it.slug);
    if (!p) continue;
    const parts = ((comps ?? []) as Comp[]).filter((c) => c.pack_id === p.id);
    const list = parts.length ? parts.map((c) => ({ id: c.component_id, n: c.qty * it.qty })) : [{ id: p.id, n: it.qty }];
    for (const { id, n } of list) {
      need.set(id, (need.get(id) ?? 0) + n);
      if (!usedBy.has(id)) usedBy.set(id, new Set());
      usedBy.get(id)!.add(p.name);
    }
  }
  for (const [id, n] of need) {
    const c = byId.get(id);
    if (!c || c.stock === null || c.stock >= n) continue;
    const left = Math.max(0, c.stock);
    const where = [...(usedBy.get(id) ?? [])].join(' y ');
    return left === 0
      ? `Se nos ha agotado ${c.name}${where !== c.name ? ` (va en ${where})` : ''}. Quítalo del carrito para continuar.`
      : `Solo nos quedan ${left} ${left === 1 ? 'bote' : 'botes'} de ${c.name}${where !== c.name ? ` (va en ${where})` : ''}. Baja la cantidad para continuar.`;
  }
  return null;
}
