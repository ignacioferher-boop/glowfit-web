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
        { id: 'plazos', title: 'Plazos de entrega', body: <>
          <p>El plazo habitual de entrega es de <strong>{SHIPPING.minDays} a {SHIPPING.maxDays} días laborables</strong> desde la confirmación del pedido (sin contar sábados, domingos ni festivos).</p>
          <p>Cuando tu pedido salga de nuestro almacén te enviaremos un email con el <strong>transportista y el número de seguimiento</strong>, para que puedas consultar dónde está tu paquete en todo momento. También puedes verlo en <a href="/mi-pedido/">Mi pedido</a>.</p>
        </> },
        { id: 'retrasos', title: 'Retrasos en la entrega', body: <>
          <p>Los plazos indicados son <strong>orientativos</strong>. Una vez entregado el paquete a la empresa de transporte, la entrega depende de ella. Glowfit no se hace responsable de los retrasos causados por la empresa de transporte ni de los debidos a causas ajenas a nuestro control (fenómenos meteorológicos, huelgas, incidencias de tráfico, fechas de alta demanda o causas de fuerza mayor).</p>
          <p>Si tu pedido se retrasa, escríbenos y lo gestionaremos con el transportista hasta que te llegue. Todo ello <strong>sin perjuicio de los derechos que la ley te reconoce como consumidor</strong>: si el pedido no se entregara en un plazo de 30 días naturales, podrás cancelarlo y te devolveremos el importe íntegro.</p>
        </> },
        { id: 'incidencias', title: 'Incidencias', body: <p>Si el paquete llega dañado, anótalo en el albarán del transportista y escríbenos en un plazo de 48 horas con una foto. Te enviaremos un producto nuevo sin coste.</p> },
      ]}
    />
  );
}
