import { getProducts } from '@/lib/data';
import { TEST_PRODUCT_SLUG } from '@/lib/config';
import { getHome } from '@/lib/home';
import { enrich } from '@/lib/shop';
import HomeSections from '@/components/HomeSections';

export const revalidate = 300;

export default async function Home() {
  const [products, home] = await Promise.all([getProducts().then((ps) => enrich(ps.filter((p) => p.slug !== TEST_PRODUCT_SLUG))), getHome()]);
  return <HomeSections sections={home.sections} products={products} />;
}
