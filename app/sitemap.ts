import type { MetadataRoute } from 'next';
import { getProducts } from '@/lib/data';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const statics = ['', 'productos', 'blog', 'sobre-nosotros', 'lifestyle', 'wellness', 'fitness', 'nutricion', 'beauty-self-care', 'the-glowfit-edit', 'envios-y-entregas', 'aviso-legal', 'politica-de-privacidad', 'politica-de-cookies', 'condiciones-de-contratacion', 'reembolso_devoluciones', 'preguntas-frecuentes', 'sobre-glowfit'];
  const products = (await getProducts()).map((p) => `producto/${p.slug}`);
  const now = new Date();
  return [...statics, ...products].map((p) => ({ url: `${site}/${p}${p ? '/' : ''}`, lastModified: now, changeFrequency: p.startsWith('producto/') || p === '' || p === 'productos' ? 'weekly' : 'monthly', priority: p === '' ? 1 : p.startsWith('producto/') || p === 'productos' ? 0.9 : 0.5 }));
}
