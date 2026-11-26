import { revalidatePath } from 'next/cache';
import { supabasePublic } from './data';

// 2 de diciembre a las 00:00 (Madrid): termina el Black Friday.
// Pone a la venta la guía (4,99 €), quita el Pack Black Friday y vuelve el pack normal al mismo precio, y apaga el aviso superior.
// La base de datos no hace nada antes de esa hora y solo actúa una vez, así que se puede llamar sin riesgo.
export async function endBlackFriday(): Promise<{ ok: boolean; already?: boolean; reason?: string }> {
  if (!supabasePublic || !process.env.ORDER_SECRET) return { ok: false, reason: 'config' };
  const { data, error } = await supabasePublic.rpc('shop_end_black_friday', { p_secret: process.env.ORDER_SECRET });
  if (error) { console.error('shop_end_black_friday', error.message); return { ok: false, reason: 'db' }; }
  const r = data as { ok: boolean; already?: boolean; reason?: string };
  if (r.ok && !r.already) revalidatePath('/', 'layout');
  return r;
}
