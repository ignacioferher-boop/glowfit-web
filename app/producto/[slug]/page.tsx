import BlackFridayPromo from '@/components/BlackFridayPromo';
import GiftGuide, { BfRibbon } from '@/components/GiftGuide';
import { guideGiftActive } from '@/lib/guide-gift';
import { notFound, redirect } from 'next/navigation';
import { cleanHtml } from '@/lib/sanitize';
import type { Metadata } from 'next';
import { getProducts } from '@/lib/data';
import { SHIPPING } from '@/lib/config';
import { enrich } from '@/lib/shop';
import Gallery from '@/components/Gallery';
import AddToCart from '@/components/AddToCart';
import ProductCard from '@/components/ProductCard';
import TrustBar from '@/components/TrustBar';
import { Price, CurrencyNote } from '@/components/currency';
import Reviews, { RatingSummary } from '@/components/Reviews';
import { avgRating, getReviews } from '@/lib/reviews';

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = enrich(await getProducts()).find((x) => x.slug === slug);
  if (!p) return {};
  const desc = (p.short_description || p.tagline || p.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 155);
  return { title: p.name, description: desc, openGraph: { images: p.images.slice(0, 1) } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const all = enrich(await getProducts());
  const product = all.find((p) => p.slug === slug);
  if (!product) {
    // Mientras dura el Black Friday, el Pack Quema Grasa está oculto: quien llegue por un enlace antiguo ve la oferta
    if (slug === 'pack-glowxpro-bloom' && all.some((p) => p.slug === 'pack-black-friday')) redirect('/producto/pack-black-friday/');
    notFound();
  }
  const related = [...all.filter((p) => p.slug !== slug && p.category === product.category), ...all.filter((p) => p.slug !== slug && p.category !== product.category)].slice(0, 3);
  const save = product.compareAtCents ? product.compareAtCents - product.price_cents : 0;
  const isPack = product.includes.length > 0;
  const reviews = await getReviews(slug);
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://glowfit.group').replace(/\/$/, '');
  const longDesc = product.description && product.description !== product.short_description && !isPack ? product.description : null;
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: product.name, image: product.images,
    description: product.tagline ?? undefined, brand: { '@type': 'Brand', name: 'Glowfit' },
    sku: product.slug, url: `${site}/producto/${product.slug}/`,
    offers: {
      '@type': 'Offer', url: `${site}/producto/${product.slug}/`, priceCurrency: 'EUR', price: (product.price_cents / 100).toFixed(2), itemCondition: 'https://schema.org/NewCondition',
      availability: product.available === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Glowfit' },
      shippingDetails: {
        '@type': 'OfferShippingDetails', shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'ES' },
        shippingRate: { '@type': 'MonetaryAmount', currency: 'EUR', value: (product.price_cents >= SHIPPING.freeFromCents && SHIPPING.freeFromCents > 0 ? 0 : SHIPPING.standardCents / 100).toFixed(2) },
        deliveryTime: { '@type': 'ShippingDeliveryTime', handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' }, transitTime: { '@type': 'QuantitativeValue', minValue: SHIPPING.minDays, maxValue: SHIPPING.maxDays, unitCode: 'DAY' } },
      },
      hasMerchantReturnPolicy: { '@type': 'MerchantReturnPolicy', applicableCountry: 'ES', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: 14, returnMethod: 'https://schema.org/ReturnByMail' },
    },
    ...(reviews.length ? {
      aggregateRating: { '@type': 'AggregateRating', ratingValue: avgRating(reviews), reviewCount: reviews.length },
      review: reviews.slice(0, 5).map((r) => ({ '@type': 'Review', author: { '@type': 'Person', name: r.name }, datePublished: r.created_at.slice(0, 10), reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 }, ...(r.body ? { reviewBody: r.body } : {}) })),
    } : {}),
  };
  return (
    <section className="page-section product-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="breadcrumb" aria-label="Migas de pan">
        <a href="/">Inicio</a><span aria-hidden="true">/</span><a href="/productos/">Productos</a>
        {product.catLabel && <><span aria-hidden="true">/</span><a href={`/productos/?cat=${encodeURIComponent(product.category!)}`}>{product.catLabel}</a></>}
      </nav>
      <div className="product-layout">
        <div className="product-media"><Gallery images={product.images} name={product.name} overlay={guideGiftActive() && product.available !== 0 ? <BfRibbon big pack={product.slug === 'pack-black-friday'} /> : null} /></div>
        <div className="product-info">
          {guideGiftActive() && <p className="kiona bf-eyebrow-dark">BLACK FRIDAY · REGALO INCLUIDO</p>}
          {product.catLabel && <p className="kiona card-cat">{product.catLabel.toUpperCase()}</p>}
          <h1>{product.name}</h1>
          {product.tagline && <p className="product-tagline">{product.tagline}</p>}
          <RatingSummary reviews={reviews} />
          <div className="price-row">
            <Price className="price big" cents={product.price_cents} />
            {product.compareAtCents && <s><Price cents={product.compareAtCents} /></s>}
            {save > 0 && <span className="card-badge save static">Ahorras <Price cents={save} /></span>}
            {(product.slug === 'pack-black-friday' || guideGiftActive()) && <span className="card-badge bf static">{product.slug === 'pack-black-friday' ? 'BLACK FRIDAY' : 'BLACK FRIDAY · 🎁 GUÍA DE REGALO'}</span>}
          </div>
          <p className="tax-note">IVA incluido{SHIPPING.freeFromCents > 0 && (product.price_cents >= SHIPPING.freeFromCents ? ' · Envío gratis' : <> · Envío gratis desde <Price cents={SHIPPING.freeFromCents} /></>)}</p>

          {isPack && (
            <div className="pack-includes">
              <p className="kiona pack-title">ESTE PACK INCLUYE</p>
              <ul>
                {product.includes.map((i) => (
                  <li key={i.slug}><a href={`/producto/${i.slug}/`}><img src={i.images[0]} alt="" /><span>{i.name}</span><small><Price cents={i.price_cents} /></small></a></li>
                ))}
              </ul>
            </div>
          )}
          <CurrencyNote eurCents={product.price_cents} />
          {!isPack && product.short_description && <div className="rich product-short" dangerouslySetInnerHTML={{ __html: cleanHtml(product.short_description) }} />}

          <AddToCart product={product} withQty />
          <GiftGuide variant="compact" />
          <BlackFridayPromo exclude={product.slug} />
          <TrustBar variant="list" />

          <div className="product-details">
            {longDesc && (
              <details open>
                <summary>Descripción</summary>
                <div className="rich" dangerouslySetInnerHTML={{ __html: cleanHtml(longDesc) }} />
              </details>
            )}
            <details>
              <summary>Envíos y entregas</summary>
              <p>Enviamos a toda España en {SHIPPING.minDays}–{SHIPPING.maxDays} días laborables. El envío cuesta <Price cents={SHIPPING.standardCents} />{SHIPPING.freeFromCents > 0 && <> y es gratis a partir de <Price cents={SHIPPING.freeFromCents} /></>}. <a href="/envios-y-entregas/">Más información</a></p>
            </details>
            <details>
              <summary>Devoluciones</summary>
              <p>Tienes 14 días desde que lo recibes para devolver productos precintados y sin abrir. <a href="/reembolso_devoluciones/">Ver cómo devolver</a></p>
            </details>
            <details>
              <summary>Uso responsable</summary>
              <p>Complemento alimenticio. No sustituye una dieta variada y equilibrada ni un estilo de vida saludable. No superes la dosis diaria recomendada y mantenlo fuera del alcance de los niños. Revisa ingredientes y alérgenos en las imágenes del producto.</p>
            </details>
          </div>
        </div>
      </div>
      <Reviews reviews={reviews} />
      {related.length > 0 && (
        <div className="related">
          <p className="kiona section-eyebrow center">COMPLETA TU RUTINA</p>
          <h2 className="section-title small">TAMBIÉN TE PUEDE GUSTAR</h2>
          <ul className="product-grid">{related.map((p) => <ProductCard key={p.slug} product={p} />)}</ul>
        </div>
      )}
    </section>
  );
}
