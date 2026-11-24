import LegalLayout from '@/components/legal/LegalLayout';
export const metadata = { title: 'Sobre Glowfit', description: 'Glowfit: complementos alimenticios para acompañar tus hábitos de bienestar, por dentro y por fuera.' };

export default function Page() {
  return (
    <LegalLayout
      current="/sobre-glowfit/"
      eyebrow="NUESTRA MARCA"
      title="SOBRE GLOWFIT"
      intro={<p>Glowfit nace con una idea sencilla: cuidarte por dentro para sentirte bien por fuera.</p>}
      sections={[
        { id: 'que', title: 'Qué hacemos', body: <p>Seleccionamos complementos alimenticios pensados para acompañar tu día a día: ayudarte a controlar tu peso, sentirte menos hinchada y mejorar tus digestiones. Fórmulas sencillas, fáciles de incorporar a tu rutina.</p> },
        { id: 'como', title: 'Cómo lo entendemos', body: <p>Creemos que el bienestar se construye con hábitos: comer bien, moverse, descansar e hidratarse. Nuestros productos están para sumar a esos hábitos, no para sustituirlos.</p> },
        { id: 'compromiso', title: 'Nuestro compromiso contigo', body: <ul>
          <li>Información clara sobre cada producto y cómo tomarlo.</li>
          <li>Pago seguro y envío rápido a toda España.</li>
          <li>Atención cercana: si tienes una duda, te responde una persona.</li>
        </ul> },
        { id: 'contacto', title: 'Hablemos', body: <p>¿Tienes preguntas sobre un producto o tu pedido? Escríbenos desde nuestro <a href="/sobre-nosotros/">formulario de contacto</a> o revisa las <a href="/preguntas-frecuentes/">preguntas frecuentes</a>.</p> },
      ]}
    />
  );
}
