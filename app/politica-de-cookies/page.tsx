import LegalLayout from '@/components/legal/LegalLayout';
import { LEGAL } from '@/lib/legal';
export const metadata = { title: 'Política de cookies' };

export default function Page() {
  return (
    <LegalLayout
      current="/politica-de-cookies/"
      eyebrow="COOKIES"
      title="POLÍTICA DE COOKIES"
      intro={<p>Te explicamos qué cookies y tecnologías similares usa la web de {LEGAL.brand}. Spoiler: solo las imprescindibles para que la tienda funcione.</p>}
      sections={[
        { id: 'que-son', title: 'Qué son las cookies', body: <p>Son pequeños archivos o datos que la web guarda en tu navegador para recordar información, como los productos de tu carrito.</p> },
        { id: 'cuales', title: 'Qué cookies usamos', body: <>
          <div className="legal-table" role="table">
            <div role="row" className="head"><span role="columnheader">Nombre</span><span role="columnheader">Para qué sirve · Duración</span></div>
            <div role="row"><span role="cell">glowfit-cart</span><span role="cell">Guarda los productos de tu carrito (almacenamiento local) · Hasta que lo vacíes</span></div>
            <div role="row"><span role="cell">glowfit-cookies</span><span role="cell">Recuerda que has visto este aviso · Persistente</span></div>
            <div role="row"><span role="cell">Stripe (__stripe_mid, __stripe_sid)</span><span role="cell">Prevención del fraude durante el pago, en la pasarela de Stripe · Hasta 1 año</span></div>
          </div>
          <p>Todas son <strong>técnicas o necesarias</strong> y están exentas de consentimiento (art. 22.2 LSSI). No usamos cookies de analítica ni de publicidad. Si en el futuro las incorporamos, te pediremos permiso antes.</p>
        </> },
        { id: 'desactivar', title: 'Cómo desactivarlas', body: <p>Puedes borrar o bloquear las cookies desde la configuración de tu navegador (Chrome, Safari, Firefox o Edge). Si lo haces, es posible que el carrito no funcione correctamente.</p> },
      ]}
    />
  );
}
