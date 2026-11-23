import LegalLayout from '@/components/legal/LegalLayout';
import { SHIPPING, formatEUR } from '@/lib/config';
export const metadata = { title: 'Envíos y entregas' };

export default function Page() {
  return (
    <LegalLayout
      current="/envios-y-entregas/"
      eyebrow="AYUDA Y COMPRAS"
      title="ENVÍOS Y ENTREGAS"
      intro={<p>Preparamos tu pedido con mimo para que llegue cuanto antes y en perfecto estado.</p>}
      sections={[
        { id: 'zonas', title: 'Dónde enviamos', body: <p>Enviamos a toda España.</p> },
        { id: 'precio', title: 'Precio del envío', body: <ul>
          <li>Envío estándar: <strong>{formatEUR(SHIPPING.standardCents)}</strong></li>
          {SHIPPING.freeFromCents > 0 && <li><strong>Gratis</strong> en pedidos a partir de {formatEUR(SHIPPING.freeFromCents)}</li>}
        </ul> },
        { id: 'plazos', title: 'Plazos de entrega', body: <p>Entregamos en <strong>{SHIPPING.minDays} a {SHIPPING.maxDays} días laborables</strong> desde la confirmación del pedido. Te avisaremos por email cuando tu pedido salga de nuestro almacén.</p> },
        { id: 'incidencias', title: 'Incidencias', body: <p>Si el paquete llega dañado, anótalo en el albarán del transportista y escríbenos en un plazo de 48 horas con una foto. Te enviaremos un producto nuevo sin coste.</p> },
      ]}
    />
  );
}
