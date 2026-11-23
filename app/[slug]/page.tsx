import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPage } from '@/lib/data';

export const revalidate = 300;
const EXCLUDED = new Set(['carrito', 'tienda', 'finalizar-compra', 'productos-3', 'blog', 'sobre-nosotros']);
const BLOG = new Set(['lifestyle', 'wellness', 'fitness', 'nutricion', 'beauty-self-care', 'the-glowfit-edit']);

const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&#8217;/g, '’').replace(/&#8211;/g, '–').replace(/&nbsp;/g, ' ');

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = EXCLUDED.has(slug) ? null : await getPage(slug);
  return page ? { title: decode(page.title) } : {};
}

export default async function WpPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (EXCLUDED.has(slug)) notFound();
  const page = await getPage(slug);
  if (!page) notFound();
  // Quita restos de formularios de WordPress que no funcionan fuera de WP
  const html = page.content.replace(/<form[\s\S]*?<\/form>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  const empty = html.replace(/<[^>]+>/g, '').trim().length === 0;
  return (
    <article className={`page-section wp-page ${BLOG.has(slug) ? 'blog-post' : 'legal'}`}>
      {!BLOG.has(slug) && <h1 className="section-title">{decode(page.title).toUpperCase()}</h1>}
      {empty ? <p className="center">Estamos preparando este contenido. Si tienes cualquier duda, <a href="/sobre-nosotros/">escríbenos</a>.</p>
        : <div className="wp-content" dangerouslySetInnerHTML={{ __html: html }} />}
    </article>
  );
}
