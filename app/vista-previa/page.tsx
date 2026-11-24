'use client';
import { useEffect, useRef, useState } from 'react';
import HomeSections from '@/components/HomeSections';
import { SECTION_LABELS, type HomeContent } from '@/lib/home';
import type { ShopProduct } from '@/lib/shop';

type Msg = { type: 'draft'; home: HomeContent; products: ShopProduct[]; selected: string | null } | { type: 'scrollTo'; id: string };

// Página que usa el editor del panel para enseñar los cambios en vivo, antes de publicarlos.
export default function Preview() {
  const [home, setHome] = useState<HomeContent | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMsg = (e: MessageEvent<Msg>) => {
      if (e.origin !== window.location.origin || !e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'draft') { setHome(e.data.home); setProducts(e.data.products); setSelected(e.data.selected); }
      if (e.data.type === 'scrollTo') root.current?.querySelector(`[data-sid="${CSS.escape(e.data.id)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener('message', onMsg);
    window.parent?.postMessage({ type: 'ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    const el = root.current; if (!el) return;
    el.querySelectorAll<HTMLElement>('.hs-edit').forEach((n) => {
      const s = home?.sections.find((x) => x.id === n.dataset.sid);
      n.classList.toggle('selected', n.dataset.sid === selected);
      if (s) n.dataset.label = SECTION_LABELS[s.type];
    });
  }, [home, selected]);

  function onClick(e: React.MouseEvent) {
    const sec = (e.target as HTMLElement).closest<HTMLElement>('.hs-edit');
    if ((e.target as HTMLElement).closest('a, button')) e.preventDefault();
    if (sec?.dataset.sid) { e.preventDefault(); window.parent?.postMessage({ type: 'select', id: sec.dataset.sid }, window.location.origin); }
  }

  if (!home) return <div className="hs-preview" style={{ minHeight: '60vh' }} />;
  const a = home.announcement;
  return (
    <div className="hs-preview" ref={root} onClickCapture={onClick}>
      {a.enabled && a.text.trim() && <p className="announce draft" style={{ margin: 0 }}>{a.text}</p>}
      <HomeSections sections={home.sections} products={products} editable />
    </div>
  );
}
