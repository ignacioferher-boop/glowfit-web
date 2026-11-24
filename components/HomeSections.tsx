import { Fragment, type ReactNode } from 'react';
import ProductCard from './ProductCard';
import { media } from '@/lib/config';
import type { ShopProduct } from '@/lib/shop';
import type { Section } from '@/lib/home';

const safeLink = (l?: string) => (l && /^(\/|https?:\/\/|mailto:|tel:|#)/i.test(l.trim()) ? l.trim() : '/productos/');

function Lines({ text }: { text: string }) {
  const lines = (text || '').split('\n');
  return <>{lines.map((l, i) => <Fragment key={i}>{l}{i < lines.length - 1 && <br />}</Fragment>)}</>;
}
function Paragraphs({ text }: { text: string }) {
  return <>{(text || '').split(/\n{2,}/).filter((p) => p.trim()).map((p, i) => <p key={i}><Lines text={p} /></p>)}</>;
}

function Wrap({ s, editable, children }: { s: Section; editable?: boolean; children: ReactNode }) {
  if (!editable) return <>{children}</>;
  return <div className="hs-edit" data-sid={s.id}>{children}</div>;
}

export default function HomeSections({ sections, products, editable = false }: { sections: Section[]; products: ShopProduct[]; editable?: boolean }) {
  return (
    <>
      {sections.filter((s) => !s.hidden).map((s, idx) => (
        <Wrap key={s.id} s={s} editable={editable}>
          {s.type === 'hero' && (
            <section className="hero" style={s.background ? { backgroundImage: `url(${s.background})` } : undefined}>
              <div className="hero-inner">
                <div className="hero-text">
                  {s.logo && <img className="hero-logo" src={s.logo} alt="Glowfit Wellness" />}
                  {s.eyebrow && <h2 className="kiona eyebrow">{s.eyebrow}</h2>}
                  <img className="brillo" src={media('2026/05/BRILLO-LINEA.png')} alt="" />
                  {idx === 0 && !s.logo ? <h1 className="script hero-title"><Lines text={s.title} /></h1> : <p className="script hero-title"><Lines text={s.title} /></p>}
                  {s.subtitle && <p className="hero-sub">{s.subtitle}</p>}
                  {s.button_text && <a className="btn" href={safeLink(s.button_link)}>{s.button_text}</a>}
                </div>
                {s.image && <div className="hero-img"><img src={s.image} alt="" /></div>}
              </div>
            </section>
          )}
          {s.type === 'products' && (
            <section className="favoritos" style={s.background ? { backgroundImage: `url(${s.background})` } : undefined}>
              {s.eyebrow && <p className="kiona section-eyebrow"><strong>{s.eyebrow}</strong></p>}
              {s.title && <h2 className="section-title">{s.title}</h2>}
              {s.subtitle && <p className="section-sub">{s.subtitle}</p>}
              <ul className="product-grid">{(s.only?.length ? products.filter((p) => s.only!.includes(p.slug)) : products).map((p) => <ProductCard key={p.slug} product={p} />)}</ul>
              <img className="brillo center" src={media('2026/05/BRILLO-LINEA.png')} alt="" />
            </section>
          )}
          {s.type === 'text_image' && (
            <section className={`about${s.reverse ? ' reverse' : ''}`}>
              {!s.reverse && <div className="about-img">{s.image && <img src={s.image} alt="" loading="lazy" />}</div>}
              <div className="about-text">
                {s.title && <h2 className="section-title small">{s.title}</h2>}
                <Paragraphs text={s.body} />
                {s.button_text && <a className="btn" href={safeLink(s.button_link)}>{s.button_text}</a>}
              </div>
              {s.reverse && <div className="about-img">{s.image && <img src={s.image} alt="" loading="lazy" />}</div>}
            </section>
          )}
          {s.type === 'text' && (
            <section className={`hs-text ${s.align === 'left' ? 'left' : 'center'}`}>
              {s.title && <h2 className="section-title small">{s.title}</h2>}
              <Paragraphs text={s.body} />
            </section>
          )}
          {s.type === 'image' && s.image && (
            <section className={`hs-image${s.wide ? ' wide' : ''}`}>
              <figure>
                {s.link ? <a href={safeLink(s.link)}><img src={s.image} alt={s.caption || ''} loading="lazy" /></a> : <img src={s.image} alt={s.caption || ''} loading="lazy" />}
                {s.caption && <figcaption>{s.caption}</figcaption>}
              </figure>
            </section>
          )}
          {s.type === 'banner' && (
            <section className={`hs-banner ${s.color}`}>
              <div>
                {s.title && <h2 className="kiona">{s.title}</h2>}
                {s.body && <p>{s.body}</p>}
              </div>
              {s.button_text && <a className="btn" href={safeLink(s.button_link)}>{s.button_text}</a>}
            </section>
          )}
        </Wrap>
      ))}
    </>
  );
}
