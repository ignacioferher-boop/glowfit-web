import TextPageView from '@/components/TextPageView';
import { getTextPage } from '@/lib/pages';
export const metadata = { title: 'Sobre Glowfit', description: 'Glowfit: complementos alimenticios para acompañar tus hábitos de bienestar, por dentro y por fuera.' };
export const revalidate = 300;

export default async function Page() {
  return <TextPageView page={await getTextPage('sobre-glowfit')} current="/sobre-glowfit/" />;
}
