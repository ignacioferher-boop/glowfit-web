import TextPageView from '@/components/TextPageView';
import { getTextPage } from '@/lib/pages';
export const metadata = { title: 'Preguntas frecuentes', description: 'Envíos, pagos, devoluciones y uso de los complementos Glowfit: resolvemos tus dudas.' };
export const revalidate = 300;

export default async function Page() {
  return <TextPageView page={await getTextPage('preguntas-frecuentes')} current="/preguntas-frecuentes/" />;
}
