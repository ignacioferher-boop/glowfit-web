import { sb } from './supabase-browser';
// Llama a una API del servidor con la sesión del administrador
export async function adminFetch<T = Record<string, unknown>>(path: string, init: { method?: string; body?: unknown } = {}): Promise<{ ok: boolean; data: T & { error?: string } }> {
  const { data: { session } } = await sb().auth.getSession();
  const r = await fetch(path, { method: init.method ?? 'GET', headers: { 'content-type': 'application/json', authorization: `Bearer ${session?.access_token ?? ''}` }, body: init.body ? JSON.stringify(init.body) : undefined }).catch(() => null);
  const data = (r ? await r.json().catch(() => ({})) : { error: 'Sin conexión. Inténtalo de nuevo.' }) as T & { error?: string };
  return { ok: !!r?.ok, data };
}
