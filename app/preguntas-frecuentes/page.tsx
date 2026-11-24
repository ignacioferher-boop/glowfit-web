import LegalLayout from '@/components/legal/LegalLayout';
import { SHIPPING, formatEUR } from '@/lib/config';
export const metadata = { title: 'Preguntas frecuentes', description: 'Envíos, pagos, devoluciones y uso de los complementos Glowfit: resolvemos tus dudas.' };

export default function Page() {
  return (
    <LegalLayout
      current="/preguntas-frecuentes/"
      eyebrow="AYUDA Y COMPRAS"
      title="PREGUNTAS FRECUENTES"
      intro={<p>Aquí tienes las respuestas a las dudas más habituales. Si no encuentras la tuya, escríbenos y te ayudamos.</p>}
      sections={[
        { id: 'envio', title: '¿Cuánto tarda y cuánto cuesta el envío?', body: <p>Enviamos a toda España en <strong>{SHIPPING.minDays} a {SHIPPING.maxDays} días laborables</strong>. El envío estándar cuesta {formatEUR(SHIPPING.standardCents)}{SHIPPING.freeFromCents > 0 && <> y es <strong>gratis a partir de {formatEUR(SHIPPING.freeFromCents)}</strong></>}. Más detalles en <a href="/envios-y-entregas/">Envíos y entregas</a>.</p> },
        { id: 'seguimiento', title: '¿Cómo sé dónde está mi pedido?', body: <p>Al comprar recibes un email de confirmación con tu número de pedido. En <a href="/mi-pedido/">Mi pedido</a> puedes ver en todo momento si está en preparación, enviado o entregado, solo con ese número y tu email.</p> },
        { id: 'pago', title: '¿Qué formas de pago aceptáis?', body: <p>Tarjeta de débito o crédito, Apple Pay, Google Pay y PayPal. El pago se realiza en una pasarela segura y nunca vemos ni guardamos los datos de tu tarjeta.</p> },
        { id: 'moneda', title: 'Veo los precios en otra moneda, ¿cuánto pagaré?', body: <p>El selector de moneda es orientativo para que te hagas una idea del precio. El cobro se hace siempre en <strong>euros</strong>; tu banco aplicará su propio tipo de cambio si tu tarjeta es de otra moneda.</p> },
        { id: 'devolucion', title: '¿Puedo devolver un producto?', body: <p>Sí. Tienes <strong>14 días naturales</strong> desde que lo recibes para desistir de la compra, siempre que el producto esté sin abrir y con su precinto, por tratarse de un complemento alimenticio. Te explicamos cómo en <a href="/reembolso_devoluciones/">Devoluciones</a>.</p> },
        { id: 'danado', title: 'Mi pedido ha llegado dañado, ¿qué hago?', body: <p>Escríbenos en las 48 horas siguientes a la entrega con una foto del paquete y del producto, y te enviamos uno nuevo sin coste.</p> },
        { id: 'tomar', title: '¿Cómo debo tomar los productos?', body: <p>Sigue siempre la dosis diaria recomendada que aparece en el envase y no la superes. Los complementos alimenticios no sustituyen una dieta variada y equilibrada ni un estilo de vida saludable.</p> },
        { id: 'quien', title: '¿Los puede tomar cualquier persona?', body: <p>No están recomendados para menores de 18 años, ni durante el embarazo o la lactancia. Si tomas medicación o tienes alguna condición de salud, consulta antes con tu médico o farmacéutico.</p> },
        { id: 'resultados', title: '¿Cuándo notaré los resultados?', body: <p>Cada persona es diferente. Para obtener los mejores resultados recomendamos tomarlos de forma constante y acompañarlos de una alimentación equilibrada, hidratación y actividad física.</p> },
        { id: 'cuenta', title: '¿Necesito crear una cuenta para comprar?', body: <p>No. Solo te pedimos nombre, email y teléfono para gestionar tu pedido y avisarte del envío.</p> },
      ]}
    />
  );
}
