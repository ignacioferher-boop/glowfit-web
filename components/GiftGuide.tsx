import { guideGiftActive } from '@/lib/guide-gift';

// Anuncio del regalo de Black Friday: la guía PDF con cualquier compra. Desaparece sola al acabar la promoción.
export default function GiftGuide({ variant = 'band' }: { variant?: 'band' | 'compact' }) {
  if (!guideGiftActive()) return null;
  if (variant === 'compact') return (
    <div className="gift-compact" role="note">
      <img src="/img/guia-portada.webp" alt="" width={46} height={65} />
      <p><strong>🎁 Regalo incluido</strong> con tu compra: la guía de bienestar «Tu momento, cada día» (PDF, 36 páginas). Te llega en el email de confirmación.</p>
    </div>
  );
  return (
    <section className="gift-band" aria-label="Regalo Black Friday">
      <div className="gift-inner">
        <div className="gift-cover"><img src="/img/guia-portada.webp" alt="Portada de la guía Tu momento, cada día" width={260} height={368} /></div>
        <div className="gift-text">
          <p className="kiona gift-eyebrow">BLACK FRIDAY · REGALO CON CUALQUIER COMPRA</p>
          <h2 className="gift-title">Te regalamos nuestra guía <em>Tu momento, cada día</em></h2>
          <p className="gift-lead">36 páginas para cuidarte sin agobios: cómo encajar tu rutina Glowfit, ideas de alimentación, agua, descanso, movimiento y pequeños hábitos que se quedan. Sin dietas imposibles ni órdenes: opciones reales para tu día a día.</p>
          <ul className="gift-points">
            <li>Con <strong>cualquier pedido</strong>, sin importe mínimo</li>
            <li>La recibes al momento en tu email de confirmación</li>
            <li>Solo esta semana de Black Friday</li>
          </ul>
          <a className="btn gift-btn" href="/productos/">Elegir mi producto</a>
        </div>
      </div>
    </section>
  );
}
