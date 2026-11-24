import { supabasePublic } from './data';

export type InventorySettings = {
  /** Con este número de unidades o menos se muestra el aviso de últimas unidades */
  low_stock_threshold: number;
  /** Minutos que se guarda el producto a un cliente mientras paga (Stripe exige 30 como mínimo) */
  reserve_minutes: number;
  /** true: "¡Quedan solo 3!" · false: "¡Últimas unidades!" */
  show_exact: boolean;
  /** Email a la tienda cuando un producto baja del umbral tras una venta */
  notify_low_stock: boolean;
};

export const INVENTORY_DEFAULTS: InventorySettings = { low_stock_threshold: 5, reserve_minutes: 30, show_exact: true, notify_low_stock: true };

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  if (!supabasePublic) return fallback;
  const { data, error } = await supabasePublic.from('site_settings').select('value').eq('key', key).maybeSingle();
  if (error || !data) return fallback;
  const v = data.value as T;
  return v && typeof v === 'object' && !Array.isArray(v) && fallback && typeof fallback === 'object' && !Array.isArray(fallback) ? { ...fallback, ...v } : (v ?? fallback);
}

export const getInventorySettings = () => getSetting<InventorySettings>('inventory', INVENTORY_DEFAULTS);

export function stockLabel(available: number | null | undefined, s: InventorySettings): string | null {
  if (available == null) return null;
  if (available <= 0) return 'Agotado';
  if (available <= s.low_stock_threshold) return s.show_exact ? `¡Quedan solo ${available}!` : '¡Últimas unidades!';
  return null;
}
