import { createHmac, timingSafeEqual } from 'crypto';

// Seguimiento tras la compra: 3 mensajes automáticos (días 5, 15 y 28 desde la compra, solo si el pedido ya salió).
// Los textos están aquí para poder cambiarlos fácilmente. {nombre} se sustituye por el nombre del cliente.
// Sin promesas de salud ni efectos (normativa de complementos alimenticios, Reglamento UE 1924/2006).
export const FOLLOWUP_STEPS: { step: 1 | 2 | 3; day: number; label: string; subject: string; body: string }[] = [
  {
    step: 1, day: 5, label: '¿Te ha llegado?',
    subject: '{nombre}, ¿qué tal ha llegado tu pedido?',
    body: `Hola {nombre}:

Somos el equipo de Glowfit. Te escribimos solo para saber cómo ha ido todo: ¿te llegó bien tu pedido? ¿Ya has empezado?

Los primeros días son los más curiosos y también los que más dudas traen: a qué hora tomarlo, si con comida o sin ella, cómo encajarlo en tu día. Si te surge cualquier pregunta, contéstanos y te ayudamos. Detrás de este mensaje hay personas de verdad, no un robot.

Un pequeño truco que a mucha gente le funciona: dejar el bote a la vista, junto a la botella de agua o la cafetera, para que se convierta en parte de la rutina sin tener que pensarlo.

Gracias por confiar en nosotros. Nos hace mucha ilusión acompañarte en esto.

Un abrazo,
El equipo de Glowfit`,
  },
  {
    step: 2, day: 15, label: '¿Notas algún cambio?',
    subject: '{nombre}, ¿cómo vas estas dos semanas?',
    body: `Hola {nombre}:

Ya llevas un par de semanas con tu rutina Glowfit y queríamos saber de ti. ¿Cómo te estás sintiendo? ¿Notas algo distinto en tu día a día, aunque sea pequeño?

Te lo preguntamos de verdad, y no hay respuesta correcta. A algunas personas les cuesta más ser constantes, otras lo han integrado sin problema, y cada cuerpo lleva su ritmo. Si algún día se te olvidó, no pasa nada: lo importante es retomarlo al día siguiente.

Si te apetece, cuéntanos:
• ¿Lo tomas a diario? ¿A qué hora te va mejor?
• ¿Cómo vas de agua, descanso y movimiento estas semanas?
• ¿Hay algo que te esté costando?

Leemos cada respuesta y te contestamos personalmente.

Un abrazo,
El equipo de Glowfit`,
  },
  {
    step: 3, day: 28, label: 'Tu opinión al mes',
    subject: '{nombre}, un mes juntos: ¿cómo te sientes?',
    body: `Hola {nombre}:

Se cumple casi un mes desde tu pedido y nos encantaría saber, con total sinceridad, cómo ha sido la experiencia para ti.

Un mes es un buen momento para parar un segundo y mirar atrás. No solo al producto: también a ti. ¿Has encontrado un rato para cuidarte? ¿Has cambiado algún hábito, por pequeño que sea? Beber un poco más de agua, caminar más, dormir mejor… Todo eso cuenta, y mucho.

Nos ayudaría muchísimo que nos contaras:
• ¿Qué tal te ha sentado y cómo lo has notado?
• ¿Te ha resultado útil? ¿Qué es lo que más te ha gustado y qué mejorarías?
• ¿Cómo te sientes contigo ahora mismo?

Y si no ha sido lo que esperabas, también queremos saberlo. Nos sirve para mejorar y para ayudarte a encontrar lo que mejor encaje contigo.

Cuidarse no es una carrera, es un camino. Hay semanas fáciles y semanas que cuestan; lo valioso es seguir. Aquí estaremos para acompañarte.

Un abrazo enorme,
El equipo de Glowfit`,
  },
];

const firstName = (name: string) => {
  const f = (name || '').trim().split(/\s+/)[0] || '';
  return f ? f.charAt(0).toUpperCase() + f.slice(1).toLowerCase() : '';
};
export function followupText(step: number, name: string) {
  const s = FOLLOWUP_STEPS.find((x) => x.step === step)!;
  const n = firstName(name);
  const fill = (t: string) => (n ? t.replaceAll('{nombre}', n) : t.replace('{nombre}, ', '').replace(' {nombre}', '').replace(/^./, (c) => c.toUpperCase()));
  return { subject: fill(s.subject), body: fill(s.body) };
}

const key = () => process.env.ORDER_SECRET || '';
export const followupToken = (orderId: string) => createHmac('sha256', key()).update(`followup:${orderId}`).digest('base64url').slice(0, 32);
export function validFollowupToken(orderId: string, t: string) {
  if (!key() || !/^[0-9a-f-]{36}$/i.test(orderId) || !t) return false;
  const a = Buffer.from(followupToken(orderId)); const b = Buffer.from(String(t));
  return a.length === b.length && timingSafeEqual(a, b);
}
const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://glowfit.group').replace(/\/$/, '');
export const followupUrl = (orderId: string) => `${SITE()}/seguimiento/?o=${orderId}&t=${followupToken(orderId)}`;
export const followupStopUrl = (orderId: string) => `${followupUrl(orderId)}&baja=1`;
