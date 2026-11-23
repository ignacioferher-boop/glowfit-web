import LegalLayout from '@/components/legal/LegalLayout';
import { LEGAL } from '@/lib/legal';
export const metadata = { title: 'Aviso legal' };

export default function Page() {
  return (
    <LegalLayout
      current="/aviso-legal/"
      eyebrow="INFORMACIÓN LEGAL"
      title="AVISO LEGAL"
      intro={<p>En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI), te informamos de los datos del titular de esta web y de las condiciones de uso.</p>}
      sections={[
        { id: 'titular', title: 'Titular de la web', body: <ul>
          <li><strong>Titular:</strong> {LEGAL.owner}</li>
          <li><strong>NIF:</strong> {LEGAL.nif}</li>
          <li><strong>Domicilio:</strong> {LEGAL.address}</li>
          <li><strong>Email:</strong> {LEGAL.email}</li>
          <li><strong>Actividad:</strong> venta online de complementos alimenticios bajo la marca {LEGAL.brand}.</li>
        </ul> },
        { id: 'uso', title: 'Condiciones de uso', body: <p>El acceso a la web es libre y gratuito. Te comprometes a hacer un uso adecuado de sus contenidos, sin emplearlos para actividades ilícitas o que puedan dañar la web o a terceros. Las compras se rigen por las <a href="/condiciones-de-contratacion/">condiciones de contratación</a>.</p> },
        { id: 'propiedad', title: 'Propiedad intelectual', body: <p>La marca {LEGAL.brand}, el logotipo, las fotografías, los textos y el diseño de esta web pertenecen a su titular o cuentan con licencia. No está permitida su reproducción o uso sin autorización.</p> },
        { id: 'salud', title: 'Información sobre salud', body: <p>La información de esta web tiene carácter divulgativo y no sustituye el consejo de un profesional sanitario. Los complementos alimenticios no deben utilizarse como sustituto de una dieta variada y equilibrada ni de un estilo de vida saludable.</p> },
        { id: 'responsabilidad', title: 'Responsabilidad', body: <p>Trabajamos para que la información sea correcta y esté actualizada, pero no podemos garantizar la ausencia de errores puntuales. No nos responsabilizamos del contenido de webs externas enlazadas.</p> },
        { id: 'ley', title: 'Legislación aplicable', body: <p>Este aviso legal se rige por la legislación española.</p> },
      ]}
    />
  );
}
