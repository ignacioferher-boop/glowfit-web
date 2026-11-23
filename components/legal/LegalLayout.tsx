import { media } from '@/lib/config';
import { LEGAL } from '@/lib/legal';

export type LegalSection = { id: string; title: string; body: React.ReactNode };

const LINKS = [
  { href: '/condiciones-de-contratacion/', label: 'Condiciones de contratación' },
  { href: '/envios-y-entregas/', label: 'Envíos y entregas' },
  { href: '/reembolso_devoluciones/', label: 'Devoluciones' },
  { href: '/politica-de-privacidad/', label: 'Política de privacidad' },
  { href: '/politica-de-cookies/', label: 'Política de cookies' },
  { href: '/aviso-legal/', label: 'Aviso legal' },
];

export default function LegalLayout({ eyebrow, title, intro, sections, current }: {
  eyebrow: string; title: string; intro: React.ReactNode; sections: LegalSection[]; current: string;
}) {
  return (
    <div className="legal-page">
      <header className="legal-hero" style={{ backgroundImage: `url(${media('2026/05/FONDO-COLOR-scaled.png')})` }}>
        <p className="kiona legal-eyebrow">{eyebrow}</p>
        <h1 className="section-title">{title}</h1>
        <img className="brillo center" src={media('2026/05/BRILLO-LINEA.png')} alt="" />
        <p className="legal-updated">Última actualización: {LEGAL.updated}</p>
      </header>
      <div className="legal-wrap">
        <aside className="legal-aside">
          <nav aria-label="Índice">
            <p className="kiona legal-aside-title">EN ESTA PÁGINA</p>
            <ol>{sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}</ol>
          </nav>
          <nav aria-label="Información legal" className="legal-other">
            <p className="kiona legal-aside-title">INFORMACIÓN LEGAL</p>
            <ul>{LINKS.map((l) => <li key={l.href}><a href={l.href} aria-current={l.href === current ? 'page' : undefined}>{l.label}</a></li>)}</ul>
          </nav>
        </aside>
        <article className="legal-body">
          <div className="legal-intro">{intro}</div>
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="legal-section">
              <h2><span className="legal-num">{String(i + 1).padStart(2, '0')}</span>{s.title}</h2>
              {s.body}
            </section>
          ))}
          <div className="legal-contact">
            <p className="script">¿Alguna duda?</p>
            <p>Escríbenos a <strong>{LEGAL.email}</strong> o desde nuestro <a href="/sobre-nosotros/">formulario de contacto</a> y te respondemos encantados.</p>
          </div>
        </article>
      </div>
    </div>
  );
}
