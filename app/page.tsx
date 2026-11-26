import { getProducts } from '@/lib/data';
import { getHome } from '@/lib/home';
import { enrich } from '@/lib/shop';
import HomeSections from '@/components/HomeSections';
import GiftGuide from '@/components/GiftGuide';

export const revalidate = 300;

export default async function Home() {
  const [products, home] = await Promise.all([getProducts().then(enrich), getHome()]);
  // El regalo va justo después de la portada
  const [first, ...rest] = home.sections.filter((s) => !s.hidden);
  return <>{first && <HomeSections sections={[first]} products={products} />}<GiftGuide /><HomeSections sections={rest} products={products} /></>;
}
