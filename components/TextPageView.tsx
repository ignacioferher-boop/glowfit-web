import LegalLayout from '@/components/legal/LegalLayout';
import RichText from '@/components/RichText';
import type { TextPage } from '@/lib/pages';

export default function TextPageView({ page, current }: { page: TextPage; current: string }) {
  return (
    <LegalLayout
      current={current}
      eyebrow={page.eyebrow}
      title={page.title}
      intro={<RichText text={page.intro} />}
      sections={page.sections.filter((s) => s.title.trim() || s.body.trim()).map((s) => ({ id: s.id, title: s.title, body: <RichText text={s.body} /> }))}
    />
  );
}
