import { media } from '@/lib/config';
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <a href="/" className="footer-logo"><img src={media('2026/05/LOGO-GLOWFIT.png')} alt="Glowfit" /></a>
        <div className="footer-cols">
          <div><h3>INFORMACIÓN</h3><a href="/sobre-glowfit/">Sobre Glowfit</a><a href="/sobre-nosotros/">Contacto</a><a href="/blog/">Blog</a></div>
          <div><h3>AYUDA Y COMPRAS</h3><a href="/mi-pedido/">Mi pedido</a><a href="/envios-y-entregas/">Envíos y entregas</a><a href="/reembolso_devoluciones/">Devoluciones</a><a href="/preguntas-frecuentes/">Preguntas frecuentes</a></div>
          <div><h3>INFORMACIÓN LEGAL</h3><a href="/aviso-legal/">Aviso legal</a><a href="/politica-de-privacidad/">Política de privacidad</a><a href="/politica-de-cookies/">Política de cookies</a><a href="/condiciones-de-contratacion/">Condiciones de contratación</a></div>
        </div>
        <p className="copy">© {new Date().getFullYear()} Glowfit · Bienestar, belleza y hábitos</p>
      </div>
    </footer>
  );
}
