import { createHmac, timingSafeEqual } from 'crypto';
import { supabasePublic } from './data';

export type Review = { id: string; name: string; rating: number; title: string | null; body: string | null; products: string[]; reply: string | null; created_at: string };

const key = () => process.env.ORDER_SECRET || '';
export const reviewToken = (orderId: string) => createHmac('sha256', key()).update(`review:${orderId}`).digest('base64url').slice(0, 32);
export function validReviewToken(orderId: string, t: string) {
  if (!key() || !orderId || !t) return false;
  const a = Buffer.from(reviewToken(orderId)); const b = Buffer.from(String(t));
  return a.length === b.length && timingSafeEqual(a, b);
}
export const reviewUrl = (orderId: string) => `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://glowfit.group').replace(/\/$/, '')}/opinar/?o=${orderId}&t=${reviewToken(orderId)}`;

// Opiniones aprobadas (de un producto o todas)
export async function getReviews(slug?: string): Promise<Review[]> {
  if (!supabasePublic) return [];
  let q = supabasePublic.from('reviews').select('id,name,rating,title,body,products,reply,created_at').eq('status', 'approved').order('created_at', { ascending: false }).limit(50);
  if (slug) q = q.contains('products', [slug]);
  const { data, error } = await q;
  if (error) return [];
  return (data as Review[]) ?? [];
}
export const avgRating = (r: Review[]) => (r.length ? Math.round((r.reduce((n, x) => n + x.rating, 0) / r.length) * 10) / 10 : 0);
