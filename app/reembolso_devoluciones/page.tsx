import LegalLayout from '@/components/legal/LegalLayout';
import { LEGAL } from '@/lib/legal';
export const metadata = { title: 'Devoluciones' };

export default function Page() {
  return (
    <LegalLayout
      current="/reembolso_devoluciones/"
      eyebrow="AYUDA Y COMPRAS"
      title="DEVOLUCIONES Y REEMBOLSOS"
      intro={<p>Queremos que estés encantada con tu compra. Si no es así, te explicamos cómo devolverla.</p>}
      sections={[
        { id: 'plazo', title: 'Plazo', body: <p>Tienes <strong>14 días naturales</strong> desde que recibes el pedido para solicitar la devolución, sin necesidad de indicar el motivo.</p> },
        { id: 'condiciones', title: 'Condiciones', body: <p>Al tratarse de complementos alimenticios, por motivos de higiene y protección de la salud solo aceptamos productos <strong>precintados, sin abrir y en su embalaje original</strong>.</p> },
        { id: 'como', title: 'Cómo solicitarla', body: <ol>
          <li>Escríbenos a {LEGAL.email} indicando tu número de pedido.</li>
          <li>Te enviaremos las instrucciones para el envío de vuelta.</li>
          <li>Los gastos de devolución corren a cargo del cliente, salvo que el producto sea defectuoso o erróneo.</li>
        </ol> },
        { id: 'reembolso', title: 'Reembolso', body: <p>Una vez recibido y revisado el producto, te devolveremos el importe en un plazo máximo de 14 días, con el mismo método de pago que usaste.</p> },
      ]}
    />
  );
}
