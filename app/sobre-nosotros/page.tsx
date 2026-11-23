import { media, SITE } from '@/lib/config';
import ContactForm from './ContactForm';
export const metadata = { title: 'Contacto' };
export default function Contacto() {
  return (
    <section className="page-section contact">
      <div className="contact-form-wrap">
        <h1 className="section-title">CONTACTO</h1>
        <p>¿Tienes alguna duda sobre nuestros productos o tu pedido? Escríbenos y te responderemos lo antes posible.</p>
        <ContactForm />
        {SITE.whatsapp && <p className="contact-alt">También puedes escribirnos por <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener">WhatsApp</a>.</p>}
      </div>
      <div className="contact-img"><img src={media('2026/10/PORTADA-BLOG.png')} alt="" loading="lazy" /></div>
    </section>
  );
}
