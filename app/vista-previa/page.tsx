'use client';
import { useEffect, useRef, useState } from 'react';
import HomeSections from '@/components/HomeSections';
import TextPageView from '@/components/TextPageView';
import FooterView from '@/components/FooterView';
import { SECTION_LABELS, type HomeContent } from '@/lib/home';
import { EDITABLE_PAGES, type FooterContent, type PageKey, type TextPage } from '@/lib/pages';
import type { ShopProduct } from '@/lib/shop';

type Draft = { type: 'draft'; page: 'home' | 'footer' | PageKey; home?: HomeContent; doc?: TextPage; footer?: FooterContent; products?: ShopProduct[]; selected?: string | null };
type Msg = Draft | { type: 'scrollTo'; id: string };

// Página que usa el editor del panel para enseñar los cambios en vivo, antes de publicarlos.
export default function Preview() {
  const [d, setD] = useState<Draft | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMsg = (e: MessageEvent<Msg>) => {
      if (e.origin !== window.location.origin || !e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'draft') setD(e.data);
      if (e.data.type === 'scrollTo') {
        const el = root.current?.querySelector<HTMLElement>(`[data-sid="${CSS.escape(e.data.id)}"], #${CSS.escape(e.data.id)}`);
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
      }
    };
    window.addEventListener('message', onMsg);
    window.parent?.postMessage({ type: 'ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    const el = root.current; if (!el || d?.page !== 'home') return;
    el.querySelectorAll<HTMLElement>('.hs-edit').forEach((n) => {
      const s = d.home?.sections.find((x) => x.id === n.dataset.sid);
      n.classList.toggle('selected', n.dataset.sid === d.selected);
      if (s) n.dataset.label = SECTION_LABELS[s.type];
    });
  }, [d]);
  useEffect(() => { if (d?.page === 'footer') window.scrollTo({ top: document.body.scrollHeight }); }, [d?.page]);

  function onClick(e: React.MouseEvent) {
    const t = e.target as HTMLElement;
    if (t.closest('a, button')) e.preventDefault();
    const sec = t.closest<HTMLElement>('.hs-edit');
    if (sec?.dataset.sid) { e.preventDefault(); window.parent?.postMessage({ type: 'select', id: sec.dataset.sid }, window.location.origin); }
    const ls = t.closest<HTMLElement>('.legal-section');
    if (ls?.id) window.parent?.postMessage({ type: 'select', id: ls.id }, window.location.origin);
    if (t.closest('.draft-footer')) window.parent?.postMessage({ type: 'select', id: '__footer' }, window.location.origin);
  }

  if (!d) return <div className="hs-preview" style={{ minHeight: '60vh' }} />;
  const a = d.home?.announcement;
  return (
    <div className="hs-preview" ref={root} onClickCapture={onClick}>
      {d.page === 'home' && d.home && (
        <>
          {a?.enabled && a.text.trim() && <p className={`announce draft${a.color && a.color !== 'verde' ? ` ${a.color}` : ''}`} style={{ margin: 0 }}>{a.text}</p>}
          <HomeSections sections={d.home.sections} products={d.products ?? []} editable />
        </>
      )}
      {d.page in EDITABLE_PAGES && d.doc && <TextPageView page={d.doc} current={EDITABLE_PAGES[d.page as PageKey].path} />}
      {d.footer && <FooterView f={d.footer} draft />}
    </div>
  );
}
