import { getProducts } from '@/lib/data';
import { media } from '@/lib/config';
import ProductCard from '@/components/ProductCard';

export const revalidate = 300;

export default async function Home() {
  const products = await getProducts();
  return (
    <>
      <section className="hero" style={{ backgroundImage: `url(${media('2026/05/FONDO-COLOR-scaled.png')})` }}>
        <div className="hero-inner">
          <div className="hero-text">
            <img className="hero-logo" src={media('2026/05/LOGO-GLOWFIT.png')} alt="Glowfit Wellness" />
            <h2 className="kiona eyebrow">BIENESTAR . BELLEZA . HÁBITOS</h2>
            <img className="brillo" src={media('2026/05/BRILLO-LINEA.png')} alt="" />
            <p className="script hero-title">TU BIENESTAR<br />TU GLOW</p>
            <p className="hero-sub">Fórmulas que te acompañan por dentro y se reflejan por fuera.</p>
            <a className="btn" href="/productos/">DESCUBRE TU GLOW &gt;</a>
          </div>
          <div className="hero-img">
            <img src={media('2026/11/3-edited-scaled.png')} alt="Pareja con productos Glowfit" />
          </div>
        </div>
      </section>

      <section className="favoritos" style={{ backgroundImage: `url(${media('2026/10/bienestar.png')})` }}>
        <p className="kiona section-eyebrow"><strong>SUPLEMENTOS</strong></p>
        <h2 className="section-title">NUESTROS FAVORITOS</h2>
        <p className="section-sub">Fórmulas pensadas para acompañarte en tu rutina de bienestar.</p>
        <ul className="product-grid">{products.map((p) => <ProductCard key={p.slug} product={p} />)}</ul>
        <img className="brillo center" src={media('2026/05/BRILLO-LINEA.png')} alt="" />
      </section>

      <section className="about">
        <div className="about-img"><img src={media('2026/06/4-300x300-1.png')} alt="" loading="lazy" /></div>
        <div className="about-text">
          <h2 className="section-title small">CONOCE UN POCO SOBRE NOSOTROS</h2>
          <p>Glowfit nació de nosotros.<br />De nuestra forma de cuidarnos, de entrenar, de viajar y de disfrutar la vida.<br />De buscar sentirnos bien por dentro para reflejarlo por fuera.</p>
          <p>Así nació Glowfit: una marca creada para acompañarte a sentirte bien, cuidarte y brillar desde dentro.</p>
        </div>
      </section>

      <section className="about reverse">
        <div className="about-text">
          <h2 className="section-title small">SUPLEMENTOS CREADOS PARA TU BIENESTAR</h2>
          <p>Nuestra línea de suplementos combina ingredientes cuidadosamente seleccionados y fórmulas desarrolladas para acompañarte en tu día a día.</p>
          <p>Desde fórmulas pensadas para complementar tus objetivos de control de peso y bienestar, hasta complementos destinados al cuidado digestivo, la belleza y el equilibrio del organismo.</p>
          <p>Cada producto Glowfit nace con un mismo propósito: ayudarte a cuidar de ti, sentirte bien y mantener un estilo de vida saludable.</p>
        </div>
        <div className="about-img"><img src={media('2026/06/FOTOS-CUADRADA-2.png')} alt="" loading="lazy" /></div>
      </section>
    </>
  );
}
