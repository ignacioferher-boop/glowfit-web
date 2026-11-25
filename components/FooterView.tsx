import { media } from '@/lib/config';
import type { FooterContent } from '@/lib/pages';

const ok = (u: string) => /^https?:\/\//i.test(u.trim());
const SOCIAL: { k: 'instagram' | 'tiktok' | 'facebook'; l: string; d: string }[] = [
  { k: 'instagram', l: 'Instagram', d: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.2-1.6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z' },
  { k: 'tiktok', l: 'TikTok', d: 'M14 3c.4 2.6 2 4.2 4.6 4.4v3a7.6 7.6 0 0 1-4.5-1.5v6.3A5.8 5.8 0 1 1 8.3 9.4v3.1a2.8 2.8 0 1 0 2.7 2.8V3z' },
  { k: 'facebook', l: 'Facebook', d: 'M14 8h3V4.5h-3a4 4 0 0 0-4 4V11H7.5v3.5H10V21h3.5v-6.5H16l.6-3.5h-3.1V8.6c0-.3.2-.6.5-.6z' },
];

export default function FooterView({ f, draft = false }: { f: FooterContent; draft?: boolean }) {
  const social = SOCIAL.filter((s) => ok(f[s.k] || ''));
  return (
    <footer className={`site-footer${draft ? ' draft-footer' : ''}`}>
      <div className="footer-inner">
        <a href="/" className="footer-logo"><img src={media('2026/05/LOGO-GLOWFIT.png')} alt="Glowfit" /></a>
        {social.length > 0 && (
          <div className="footer-social">
            {social.map((s) => <a key={s.k} href={f[s.k].trim()} target="_blank" rel="noopener" aria-label={s.l}><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d={s.d} /></svg></a>)}
          </div>
        )}
        {f.note?.trim() && <p className="footer-note">{f.note}</p>}
        <div className="footer-cols">
          <div><h3>INFORMACIÓN</h3><a href="/sobre-glowfit/">Sobre Glowfit</a><a href="/sobre-nosotros/">Contacto</a><a href="/blog/">Blog</a></div>
          <div><h3>AYUDA Y COMPRAS</h3><a href="/mi-cuenta/">Mi cuenta</a><a href="/mi-pedido/">Seguir un pedido</a><a href="/envios-y-entregas/">Envíos y entregas</a><a href="/reembolso_devoluciones/">Devoluciones</a><a href="/preguntas-frecuentes/">Preguntas frecuentes</a></div>
          <div><h3>INFORMACIÓN LEGAL</h3><a href="/aviso-legal/">Aviso legal</a><a href="/politica-de-privacidad/">Política de privacidad</a><a href="/politica-de-cookies/">Política de cookies</a><a href="/condiciones-de-contratacion/">Condiciones de contratación</a></div>
        </div>
        <p className="copy">© {new Date().getFullYear()} Glowfit{f.tagline?.trim() ? ` · ${f.tagline}` : ''}</p>
      </div>
    </footer>
  );
}
