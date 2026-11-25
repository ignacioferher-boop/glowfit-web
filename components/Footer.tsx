import FooterView from './FooterView';
import { getFooter } from '@/lib/pages';

export default async function Footer() {
  return <FooterView f={await getFooter()} />;
}
