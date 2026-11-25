import { getSetting } from './settings';
import { SHIPPING, formatEUR } from './config';

export type PageSection = { id: string; title: string; body: string };
export type TextPage = { eyebrow: string; title: string; intro: string; sections: PageSection[] };
export type FooterContent = { tagline: string; instagram: string; tiktok: string; facebook: string; note: string };

export const EDITABLE_PAGES = {
  'sobre-glowfit': { label: 'Sobre Glowfit', path: '/sobre-glowfit/' },
  'preguntas-frecuentes': { label: 'Preguntas frecuentes', path: '/preguntas-frecuentes/' },
} as const;
export type PageKey = keyof typeof EDITABLE_PAGES;

const ship = `Enviamos a toda España en ${SHIPPING.minDays} a ${SHIPPING.maxDays} días laborables. El envío estándar cuesta ${formatEUR(SHIPPING.standardCents)}${SHIPPING.freeFromCents > 0 ? ` y es gratis a partir de ${formatEUR(SHIPPING.freeFromCents)}` : ''}. Más detalles en [Envíos y entregas](/envios-y-entregas/).`;

export const DEFAULT_PAGES: Record<PageKey, TextPage> = {
  'sobre-glowfit': {
    eyebrow: 'NUESTRA MARCA', title: 'SOBRE GLOWFIT',
    intro: 'Glowfit nace con una idea sencilla: cuidarte por dentro para sentirte bien por fuera.',
    sections: [
      { id: 'que', title: 'Qué hacemos', body: 'Seleccionamos complementos alimenticios pensados para acompañar tu día a día: ayudarte a controlar tu peso, sentirte menos hinchada y mejorar tus digestiones. Fórmulas sencillas, fáciles de incorporar a tu rutina.' },
      { id: 'como', title: 'Cómo lo entendemos', body: 'Creemos que el bienestar se construye con hábitos: comer bien, moverse, descansar e hidratarse. Nuestros productos están para sumar a esos hábitos, no para sustituirlos.' },
      { id: 'compromiso', title: 'Nuestro compromiso contigo', body: '- Información clara sobre cada producto y cómo tomarlo.\n- Pago seguro y envío rápido a toda España.\n- Atención cercana: si tienes una duda, te responde una persona.' },
      { id: 'contacto', title: 'Hablemos', body: '¿Tienes preguntas sobre un producto o tu pedido? Escríbenos desde nuestro [formulario de contacto](/sobre-nosotros/) o revisa las [preguntas frecuentes](/preguntas-frecuentes/).' },
    ],
  },
  'preguntas-frecuentes': {
    eyebrow: 'AYUDA Y COMPRAS', title: 'PREGUNTAS FRECUENTES',
    intro: 'Aquí tienes las respuestas a las dudas más habituales. Si no encuentras la tuya, escríbenos y te ayudamos.',
    sections: [
      { id: 'envio', title: '¿Cuánto tarda y cuánto cuesta el envío?', body: ship },
      { id: 'seguimiento', title: '¿Cómo sé dónde está mi pedido?', body: 'Al comprar recibes un email de confirmación con tu número de pedido. En [Mi pedido](/mi-pedido/) puedes ver en todo momento si está en preparación, enviado o entregado, solo con ese número y tu email.' },
      { id: 'pago', title: '¿Qué formas de pago aceptáis?', body: 'Tarjeta de débito o crédito, Apple Pay, Google Pay y PayPal. El pago se realiza en una pasarela segura y nunca vemos ni guardamos los datos de tu tarjeta.' },
      { id: 'moneda', title: 'Veo los precios en otra moneda, ¿cuánto pagaré?', body: 'El selector de moneda es orientativo para que te hagas una idea del precio. El cobro se hace siempre en **euros**; tu banco aplicará su propio tipo de cambio si tu tarjeta es de otra moneda.' },
      { id: 'devolucion', title: '¿Puedo devolver un producto?', body: 'Sí. Tienes **14 días naturales** desde que lo recibes para desistir de la compra, siempre que el producto esté sin abrir y con su precinto, por tratarse de un complemento alimenticio. Te explicamos cómo en [Devoluciones](/reembolso_devoluciones/).' },
      { id: 'danado', title: 'Mi pedido ha llegado dañado, ¿qué hago?', body: 'Escríbenos en las 48 horas siguientes a la entrega con una foto del paquete y del producto, y te enviamos uno nuevo sin coste.' },
      { id: 'tomar', title: '¿Cómo debo tomar los productos?', body: 'Sigue siempre la dosis diaria recomendada que aparece en el envase y no la superes. Los complementos alimenticios no sustituyen una dieta variada y equilibrada ni un estilo de vida saludable.' },
      { id: 'quien', title: '¿Los puede tomar cualquier persona?', body: 'No están recomendados para menores de 18 años, ni durante el embarazo o la lactancia. Si tomas medicación o tienes alguna condición de salud, consulta antes con tu médico o farmacéutico.' },
      { id: 'resultados', title: '¿Cuándo notaré los resultados?', body: 'Cada persona es diferente. Para obtener los mejores resultados recomendamos tomarlos de forma constante y acompañarlos de una alimentación equilibrada, hidratación y actividad física.' },
      { id: 'cuenta', title: '¿Necesito crear una cuenta para comprar?', body: 'No. Solo te pedimos nombre, email y teléfono para gestionar tu pedido y avisarte del envío.' },
    ],
  },
};

export const DEFAULT_FOOTER: FooterContent = { tagline: 'Bienestar, belleza y hábitos', instagram: '', tiktok: '', facebook: '', note: '' };

export async function getTextPage(key: PageKey): Promise<TextPage> {
  const v = await getSetting<TextPage | null>(`page:${key}`, null);
  return v && Array.isArray(v.sections) ? { ...DEFAULT_PAGES[key], ...v } : DEFAULT_PAGES[key];
}
export const getFooter = () => getSetting<FooterContent>('footer', DEFAULT_FOOTER);
