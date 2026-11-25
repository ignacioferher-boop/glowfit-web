import LegalLayout from '@/components/legal/LegalLayout';
import { LEGAL } from '@/lib/legal';
import { SHIPPING, formatEUR } from '@/lib/config';
export const metadata = { title: 'Condiciones de contratación' };

export default function Page() {
  return (
    <LegalLayout
      current="/condiciones-de-contratacion/"
      eyebrow="TÉRMINOS Y CONDICIONES"
      title="CONDICIONES DE CONTRATACIÓN"
      intro={<p>Estas condiciones regulan la compra de productos en la tienda online <strong>{LEGAL.brand}</strong>. Al realizar un pedido declaras haberlas leído y aceptado. Te recomendamos guardarlas o imprimirlas.</p>}
      sections={[
        { id: 'titular', title: 'Quiénes somos', body: <>
          <p>La tienda es titularidad de <strong>{LEGAL.owner}</strong>, con NIF {LEGAL.nif} y domicilio en {LEGAL.address}. Email de contacto: {LEGAL.email}.</p>
        </> },
        { id: 'productos', title: 'Productos', body: <>
          <p>Vendemos complementos alimenticios. Los complementos alimenticios no deben utilizarse como sustituto de una dieta equilibrada y un estilo de vida saludable. No superes la dosis diaria recomendada, mantenlos fuera del alcance de los niños y consulta a un profesional sanitario si estás embarazada, en periodo de lactancia, tomas medicación o tienes alguna condición médica.</p>
          <p>Las fotografías e información de cada producto (ingredientes, modo de empleo y alérgenos) se muestran en su ficha. Revisa siempre el etiquetado.</p>
        </> },
        { id: 'registro', title: 'Datos para realizar el pedido', body: <>
          <p>Para comprar es obligatorio facilitar <strong>nombre y apellidos, correo electrónico y número de teléfono</strong>, además de la dirección de envío. Los usamos para gestionar el pedido, enviarte la confirmación y el recibo, y contactar contigo si hay alguna incidencia con la entrega.</p>
          <p>Debes ser mayor de 18 años y garantizar que los datos que facilitas son verdaderos.</p>
        </> },
        { id: 'comunicaciones', title: 'Comunicaciones por correo electrónico', body: <>
          <p>Al realizar una compra, aceptas recibir en tu correo electrónico y teléfono las <strong>comunicaciones necesarias sobre tu pedido</strong>: confirmación, recibo, estado del envío e incidencias.</p>
          <p>Además, como cliente de {LEGAL.brand}, <strong>podremos enviarte por correo electrónico comunicaciones comerciales</strong> sobre productos, novedades, promociones y contenidos de bienestar de {LEGAL.brand} similares a los que has comprado, conforme al artículo 21.2 de la Ley 34/2002 (LSSI).</p>
          <p>Puedes <strong>oponerte</strong> a recibir estas comunicaciones comerciales en el momento de la compra marcando la casilla correspondiente, y en cualquier momento después, de forma sencilla y gratuita, con el enlace de baja incluido en cada email o escribiendo a {LEGAL.email}. Darte de baja no afecta a tus pedidos.</p>
        </> },
        { id: 'precios', title: 'Precios y pago', body: <>
          <p>Los precios se muestran en euros e <strong>incluyen el IVA</strong> aplicable. Los gastos de envío se indican en el carrito antes de pagar.</p>
          <p>El pago se realiza de forma segura a través de <strong>Stripe</strong> con tarjeta, Apple Pay, Google Pay o PayPal. {LEGAL.brand} no almacena en ningún momento los datos de tu tarjeta.</p>
        </> },
        { id: 'proceso', title: 'Proceso de compra', body: <>
          <ol>
            <li>Añade los productos al carrito.</li>
            <li>Rellena tus datos (nombre, email y teléfono) y acepta estas condiciones y la política de privacidad.</li>
            <li>Introduce la dirección de envío y paga en la pasarela segura.</li>
            <li>Recibirás un email de confirmación con el recibo. El contrato se entiende celebrado en ese momento.</li>
          </ol>
        </> },
        { id: 'envios', title: 'Envíos', body: <>
          <p>Enviamos a toda España. El envío estándar cuesta {formatEUR(SHIPPING.standardCents)}{SHIPPING.freeFromCents > 0 && <> y es <strong>gratis a partir de {formatEUR(SHIPPING.freeFromCents)}</strong></>}. El plazo habitual es de {SHIPPING.minDays} a {SHIPPING.maxDays} días laborables y es orientativo. Al enviar el pedido te mandaremos por email el transportista y el número de seguimiento.</p>
          <p>Glowfit no se hace responsable de los retrasos imputables a la empresa de transporte o a causas de fuerza mayor, aunque te ayudaremos a resolver cualquier incidencia con el transportista. Esto no limita los derechos que la normativa de consumo te reconoce: si el pedido no se entrega en 30 días naturales, puedes cancelarlo y recibir el reembolso completo. Más información en <a href="/envios-y-entregas/">Envíos y entregas</a>.</p>
        </> },
        { id: 'desistimiento', title: 'Derecho de desistimiento', body: <>
          <p>Dispones de <strong>14 días naturales</strong> desde la recepción para desistir de la compra sin indicar el motivo. Por motivos de higiene y salud, solo se aceptan devoluciones de productos <strong>precintados y sin abrir</strong> (art. 103 del Real Decreto Legislativo 1/2007). Consulta el procedimiento en <a href="/reembolso_devoluciones/">Devoluciones</a>.</p>
        </> },
        { id: 'garantia', title: 'Garantía y reclamaciones', body: <>
          <p>Si recibes un producto dañado o erróneo, escríbenos en un plazo de 48 horas con una foto y lo solucionaremos sin coste. También puedes presentar una reclamación a través de la plataforma europea de resolución de litigios en línea: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">ec.europa.eu/consumers/odr</a>.</p>
        </> },
        { id: 'ley', title: 'Legislación aplicable', body: <>
          <p>Estas condiciones se rigen por la legislación española. Para cualquier controversia, serán competentes los juzgados y tribunales del domicilio del consumidor.</p>
        </> },
      ]}
    />
  );
}
