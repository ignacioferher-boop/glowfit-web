import type { MetadataRoute } from 'next';
import { getProducts } from '@/lib/data';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const statics = ['', 'productos', 'blog', 'sobre-nosotros', 'lifestyle', 'wellness', 'fitness', 'nutricion', 'beauty-self-care', 'the-glowfit-edit', 'envios-y-entregas', 'aviso-legal', 'politica-de-privacidad', 'politica-de-cookies'];
  const products = (await getProducts()).map((p) => `producto/${p.slug}`);
  return [...statics, ...products].map((p) => ({ url: `${site}/${p}${p ? '/' : ''}` }));
}
