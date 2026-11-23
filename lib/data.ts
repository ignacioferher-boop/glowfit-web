import { createClient } from '@supabase/supabase-js';
import type { Page, Product } from './types';
import { SEED_PRODUCTS } from './seed';

// Valores públicos (no secretos) del proyecto Supabase glowfit; se pueden sobrescribir con variables de entorno.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vwyvmqsxiazcrhjdiucm.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_zSxDEjhUgDLaLDBJDVFvXg_rYGeW7Qi';

export const supabasePublic = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

export function supabaseAdmin() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error('Falta SUPABASE_SECRET_KEY');
  return createClient(url, secret, { auth: { persistSession: false } });
}

const FIELDS = 'id,slug,name,category,short_description,description,price_cents,images,sort';

export async function getProducts(): Promise<Product[]> {
  if (!supabasePublic) return SEED_PRODUCTS;
  const q = (f: string) => supabasePublic!.from('products').select(f).eq('active', true).order('sort');
  let { data, error } = await q(FIELDS + ',tagline');
  if (error) ({ data, error } = await q(FIELDS));
  if (error || !data) {
    console.error('getProducts', error);
    return SEED_PRODUCTS;
  }
  return data as unknown as Product[];
}

export async function getProduct(slug: string): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getPage(slug: string): Promise<Page | null> {
  if (!supabasePublic) return null;
  const { data } = await supabasePublic.from('pages').select('slug,title,content').eq('slug', slug).maybeSingle();
  return (data as Page) ?? null;
}
