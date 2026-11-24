'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { sb } from '@/lib/supabase-browser';
import { enrich, type ShopProduct } from '@/lib/shop';
import type { Product as ShopRow } from '@/lib/types';
import { DEFAULT_HOME, SECTION_LABELS, newSection, type HomeContent, type Section, type SectionType } from '@/lib/home';
import { Icon, Modal, Skeleton, Switch, when, useToast } from './ui';

const DRAFT_KEY = 'gf-home-draft';
const TYPE_HELP: Record<SectionType, string> = {
  hero: 'Lo primero que se ve: logo, título grande, botón y foto',
  products: 'Las tarjetas de tus productos con su botón de comprar',
  text_image: 'Un título y texto al lado de una foto',
  text: 'Solo título y texto, centrado o alineado a la izquierda',
  image: 'Una foto grande, con enlace opcional',
  banner: 'Una franja de color con un mensaje y un botón',
};
const TYPE_ICON: Record<SectionType, string> = { hero: 'home', products: 'bag', text_image: 'layout', text: 'edit', image: 'image', banner: 'ticket' };

const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
async function uploadImage(f: File): Promise<string | null> {
  if (!f.type.startsWith('image/') || f.size > 8 * 1024 * 1024) return null;
  const now = new Date();
  const ext = f.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${Date.now()}-${slugify(f.name.replace(/\.[^.]+$/, '')) || 'foto'}.${ext}`;
  const { error } = await sb().storage.from('media').upload(path, f, { contentType: f.type });
  if (error) return null;
  return sb().storage.from('media').getPublicUrl(path).data.publicUrl;
}
const sectionTitle = (s: Section) => {
  const t = 'title' in s && s.title ? s.title : s.type === 'image' ? s.caption : '';
  return (t || SECTION_LABELS[s.type]).replace(/\n/g, ' ');
};

export default function SiteEditor() {
  const toast = useToast();
  const [draft, setDraft] = useState<HomeContent | null>(null);
  const [published, setPublished] = useState('');
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [panel, setPanel] = useState<'list' | 'section' | 'announce' | 'add'>('list');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<Section | null>(null);
  const [versions, setVersions] = useState<{ id: number; value: HomeContent; created_at: string; created_by: string | null }[] | null>(null);
  const [dragI, setDragI] = useState<number | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / 1280)));
    ro.observe(el);
    return () => ro.disconnect();
  });
  const ready = useRef(false);

  useEffect(() => {
    (async () => {
      const [{ data: home }, { data: prods }, { data: levels }] = await Promise.all([
        sb().from('site_settings').select('value').eq('key', 'home').maybeSingle(),
        sb().from('products').select('id,slug,name,category,short_description,description,price_cents,images,sort,tagline').eq('active', true).order('sort'),
        sb().rpc('stock_levels'),
      ]);
      const pub: HomeContent = home?.value && Array.isArray((home.value as HomeContent).sections) ? { ...DEFAULT_HOME, ...(home.value as HomeContent) } : DEFAULT_HOME;
      setPublished(JSON.stringify(pub));
      let start = pub;
      try { const d = localStorage.getItem(DRAFT_KEY); if (d) { const parsed = JSON.parse(d) as HomeContent; if (Array.isArray(parsed.sections) && JSON.stringify(parsed) !== JSON.stringify(pub)) { start = parsed; toast('Hemos recuperado los cambios que no publicaste'); } } } catch {}
      setDraft(start);
      const lv = new Map(((levels ?? []) as { slug: string; available: number | null }[]).map((l) => [l.slug, l.available]));
      setProducts(enrich(((prods ?? []) as ShopRow[]).map((p) => ({ ...p, available: lv.get(p.slug) ?? null }))));
    })();
  }, [toast]);

  const send = useCallback(() => {
    if (!draft || !ready.current) return;
    frame.current?.contentWindow?.postMessage({ type: 'draft', home: draft, products, selected }, window.location.origin);
  }, [draft, products, selected]);
  useEffect(() => { send(); }, [send]);
  useEffect(() => {
    if (!draft) return;
    try { if (JSON.stringify(draft) === published) localStorage.removeItem(DRAFT_KEY); else localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch {}
  }, [draft, published]);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || !e.data) return;
      if (e.data.type === 'ready') { ready.current = true; send(); }
      if (e.data.type === 'select') { setSelected(e.data.id); setPanel('section'); setMobileView('edit'); }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [send]);

  const dirty = !!draft && JSON.stringify(draft) !== published;
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!draft) return <Skeleton rows={6} h={64} />;
  const sections = draft.sections;
  const current = sections.find((s) => s.id === selected) ?? null;
  const setSections = (f: (s: Section[]) => Section[]) => setDraft((d) => (d ? { ...d, sections: f(d.sections) } : d));
  const update = (id: string, patch: Partial<Section>) => setSections((l) => l.map((s) => (s.id === id ? ({ ...s, ...patch } as Section) : s)));
  const move = (from: number, to: number) => { if (to < 0 || to >= sections.length || from === to) return; setSections((l) => { const a = [...l]; const [m] = a.splice(from, 1); a.splice(to, 0, m); return a; }); };
  const focus = (id: string) => { setSelected(id); setPanel('section'); frame.current?.contentWindow?.postMessage({ type: 'scrollTo', id }, window.location.origin); };

  async function publish() {
    setBusy(true);
    const { data: u } = await sb().auth.getUser();
    const { error } = await sb().from('site_settings').upsert({ key: 'home', value: draft, updated_by: u.user?.email ?? null });
    if (error) { setBusy(false); return toast('No se pudo publicar', 'err'); }
    const token = (await sb().auth.getSession()).data.session?.access_token;
    const r = await fetch('/api/revalidate', { method: 'POST', headers: { authorization: `Bearer ${token ?? ''}` } }).catch(() => null);
    setBusy(false);
    setPublished(JSON.stringify(draft));
    toast(r?.ok ? '¡Publicado! Ya se ve en la web.' : 'Publicado. Se verá en la web en unos minutos.');
  }
  async function openVersions() {
    const { data } = await sb().from('site_versions').select('*').eq('key', 'home').order('created_at', { ascending: false }).limit(20);
    setVersions((data as typeof versions) ?? []);
  }

  return (
    <div className={`ad-ed ${mobileView}`}>
      <div className="ad-ed-bar ad-rise">
        <div className="ad-ed-status">{dirty ? <><i className="dot warn" />Cambios sin publicar</> : <><i className="dot ok" />Todo publicado</>}</div>
        <div className="ad-seg ad-only-mobile">
          <button className={mobileView === 'edit' ? 'active' : ''} onClick={() => setMobileView('edit')}>Editar</button>
          <button className={mobileView === 'preview' ? 'active' : ''} onClick={() => setMobileView('preview')}>Vista previa</button>
        </div>
        <div className="ad-ed-actions">
          <button className="ad-btn ghost sm" onClick={openVersions}><Icon name="history" />Versiones</button>
          <button className="ad-btn sm" disabled={!dirty} onClick={() => { setDraft(JSON.parse(published)); setPanel('list'); toast('Cambios descartados'); }}>Descartar</button>
          <button className="ad-btn primary sm" disabled={!dirty || busy} onClick={publish}>{busy ? <span className="ad-spinner sm" /> : <Icon name="check" />}Publicar</button>
        </div>
      </div>

      <div className="ad-ed-body">
        <aside className="ad-ed-panel ad-card">
          {panel === 'list' && (
            <>
              <h3>Portada de la web</h3>
              <p className="ad-muted sm">Pulsa una sección para editarla, o haz clic directamente sobre ella en la vista previa. Arrastra para cambiar el orden.</p>
              <button className="ad-ed-announce" onClick={() => setPanel('announce')}>
                <Icon name="ticket" /><span><strong>Barra de aviso</strong><small>{draft.announcement.enabled ? draft.announcement.text : 'Desactivada'}</small></span><Icon name="right" />
              </button>
              <ul className="ad-ed-list">
                {sections.map((s, i) => (
                  <li key={s.id} draggable onDragStart={() => setDragI(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragI !== null) move(dragI, i); setDragI(null); }} onDragEnd={() => setDragI(null)}
                    className={`${dragI === i ? 'dragging' : ''}${s.hidden ? ' off' : ''}${selected === s.id ? ' sel' : ''}`}>
                    <span className="ad-ed-grip" aria-hidden="true"><Icon name="grip" size={16} /></span>
                    <button className="ad-ed-item" onClick={() => focus(s.id)}>
                      <Icon name={TYPE_ICON[s.type]} size={16} />
                      <span><strong>{sectionTitle(s)}</strong><small>{SECTION_LABELS[s.type]}{s.hidden ? ' · oculta' : ''}</small></span>
                    </button>
                    <div className="ad-ed-tools">
                      <button className="ad-icon-btn" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Subir" title="Subir"><Icon name="up" size={16} /></button>
                      <button className="ad-icon-btn" onClick={() => move(i, i + 1)} disabled={i === sections.length - 1} aria-label="Bajar" title="Bajar"><Icon name="down" size={16} /></button>
                      <button className="ad-icon-btn" onClick={() => update(s.id, { hidden: !s.hidden })} aria-label={s.hidden ? 'Mostrar' : 'Ocultar'} title={s.hidden ? 'Mostrar' : 'Ocultar'}><Icon name={s.hidden ? 'eyeoff' : 'eye'} size={16} /></button>
                    </div>
                  </li>
                ))}
              </ul>
              <button className="ad-btn primary full" onClick={() => setPanel('add')}><Icon name="plus" />Añadir sección</button>
            </>
          )}

          {panel === 'add' && (
            <>
              <button className="ad-btn ghost sm" onClick={() => setPanel('list')}><Icon name="left" />Volver</button>
              <h3>Añadir sección</h3>
              <ul className="ad-ed-types">
                {(Object.keys(SECTION_LABELS) as SectionType[]).map((t) => (
                  <li key={t}><button onClick={() => { const s = newSection(t); setSections((l) => [...l, s]); setTimeout(() => focus(s.id), 50); }}>
                    <Icon name={TYPE_ICON[t]} size={20} /><span><strong>{SECTION_LABELS[t]}</strong><small>{TYPE_HELP[t]}</small></span>
                  </button></li>
                ))}
              </ul>
            </>
          )}

          {panel === 'announce' && (
            <>
              <button className="ad-btn ghost sm" onClick={() => setPanel('list')}><Icon name="left" />Secciones</button>
              <h3>Barra de aviso</h3>
              <p className="ad-muted sm">Una franja fina arriba del todo, en todas las páginas. Ideal para ofertas o envíos.</p>
              <label className="ad-switch-row big"><Switch on={draft.announcement.enabled} onChange={(v) => setDraft({ ...draft, announcement: { ...draft.announcement, enabled: v } })} label="Mostrar barra de aviso" /><span>{draft.announcement.enabled ? 'Se muestra' : 'No se muestra'}</span></label>
              <TextField label="Texto" value={draft.announcement.text} max={90} onChange={(v) => setDraft({ ...draft, announcement: { ...draft.announcement, text: v } })} />
              <LinkField value={draft.announcement.link} onChange={(v) => setDraft({ ...draft, announcement: { ...draft.announcement, link: v } })} />
            </>
          )}

          {panel === 'section' && current && (
            <>
              <div className="ad-ed-form-head">
                <button className="ad-btn ghost sm" onClick={() => { setPanel('list'); setSelected(null); }}><Icon name="left" />Secciones</button>
                <div>
                  <button className="ad-icon-btn" title="Duplicar" aria-label="Duplicar sección" onClick={() => { const c = { ...current, id: `${current.type}-${Math.random().toString(36).slice(2, 8)}` }; setSections((l) => { const i = l.findIndex((x) => x.id === current.id); const a = [...l]; a.splice(i + 1, 0, c); return a; }); focus(c.id); }}><Icon name="copy" /></button>
                  <button className="ad-icon-btn danger" title="Eliminar" aria-label="Eliminar sección" onClick={() => setDel(current)}><Icon name="trash" /></button>
                </div>
              </div>
              <h3>{SECTION_LABELS[current.type]}</h3>
              <label className="ad-switch-row"><Switch on={!current.hidden} onChange={(v) => update(current.id, { hidden: !v })} label="Mostrar sección" /><span>{current.hidden ? 'Oculta en la web' : 'Visible en la web'}</span></label>
              <SectionForm s={current} products={products} onChange={(p) => update(current.id, p)} />
            </>
          )}
        </aside>

        <div className="ad-ed-preview">
          <div className="ad-ed-devices">
            <div className="ad-seg">
              <button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')} aria-label="Vista ordenador"><Icon name="monitor" size={16} /></button>
              <button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')} aria-label="Vista móvil"><Icon name="mobile" size={16} /></button>
            </div>
            <small className="ad-muted">Vista previa · los cambios aún no son públicos hasta que pulses Publicar</small>
          </div>
          <div className={`ad-ed-frame ${device}`} ref={box}>
            <iframe ref={frame} src="/vista-previa/" title="Vista previa de la web" onLoad={() => { ready.current = true; send(); }}
              style={device === 'desktop' && scale >= 0.4 ? { width: 1280, height: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: '0 0' } : undefined} />
          </div>
        </div>
      </div>

      {del && (
        <Modal title={`¿Eliminar «${sectionTitle(del)}»?`} onClose={() => setDel(null)}>
          <p className="ad-muted">La sección desaparecerá de la portada cuando publiques. Si solo quieres quitarla un tiempo, mejor <strong>ocúltala</strong>. Siempre puedes recuperar una versión anterior desde «Versiones».</p>
          <div className="ad-modal-actions">
            <button className="ad-btn" onClick={() => { update(del.id, { hidden: true }); setDel(null); }} data-autofocus>Ocultar en vez de eliminar</button>
            <button className="ad-btn danger" onClick={() => { setSections((l) => l.filter((s) => s.id !== del.id)); setDel(null); setPanel('list'); setSelected(null); }}><Icon name="trash" />Eliminar sección</button>
          </div>
        </Modal>
      )}

      {versions && (
        <Modal title="Versiones anteriores" onClose={() => setVersions(null)}>
          <p className="ad-muted">Cada vez que publicas se guarda la versión anterior. Al recuperar una, se carga en el editor para que la revises antes de publicarla.</p>
          {versions.length === 0 ? <p className="ad-muted">Aún no hay versiones anteriores.</p> : (
            <ul className="ad-res-list">
              {versions.map((v) => (
                <li key={v.id}>
                  <span>{when(v.created_at)}{v.created_by && <small className="ad-muted"> · {v.created_by}</small>}<br /><small className="ad-muted">{v.value.sections?.length ?? 0} secciones</small></span>
                  <button className="ad-btn sm" onClick={() => { setDraft({ ...DEFAULT_HOME, ...v.value }); setVersions(null); setPanel('list'); toast('Versión cargada. Revísala y pulsa Publicar.'); }}>Recuperar</button>
                </li>
              ))}
            </ul>
          )}
          <div className="ad-modal-actions">
            <button className="ad-btn" onClick={() => { setDraft(DEFAULT_HOME); setVersions(null); setPanel('list'); toast('Diseño original cargado. Pulsa Publicar para usarlo.'); }}>Volver al diseño original</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TextField({ label, value, onChange, max, rows, hint }: { label: string; value: string; onChange: (v: string) => void; max?: number; rows?: number; hint?: string }) {
  return (
    <label className="ad-field"><span>{label}{hint && <small> · {hint}</small>}</span>
      {rows ? <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} /> : <input value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}
function LinkField({ value, onChange, label = 'Enlace' }: { value: string; onChange: (v: string) => void; label?: string }) {
  const presets = [['/productos/', 'Productos'], ['/sobre-glowfit/', 'Sobre Glowfit'], ['/preguntas-frecuentes/', 'Preguntas frecuentes'], ['/sobre-nosotros/', 'Contacto']];
  return (
    <div className="ad-field"><span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/productos/ o https://…" list="ad-links" />
      <datalist id="ad-links">{presets.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</datalist>
      <div className="ad-ed-chips">{presets.map(([v, l]) => <button type="button" key={v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}</div>
    </div>
  );
}
function ImageField({ label, value, onChange, optional }: { label: string; value: string; onChange: (v: string) => void; optional?: boolean }) {
  const toast = useToast();
  const [up, setUp] = useState(false);
  async function pick(files: FileList | null) {
    const f = files?.[0]; if (!f) return;
    if (f.size > 8 * 1024 * 1024) return toast('La imagen pesa más de 8 MB', 'err');
    setUp(true);
    const url = await uploadImage(f);
    setUp(false);
    if (!url) return toast('No se pudo subir la imagen', 'err');
    onChange(url);
  }
  return (
    <div className="ad-field"><span>{label}</span>
      <div className="ad-ed-img" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files); }}>
        {up ? <span className="ad-spinner" /> : value ? <img src={value} alt="" /> : <Icon name="image" size={28} />}
      </div>
      <div className="ad-ed-img-actions">
        <label className="ad-btn sm"><Icon name="image" />{value ? 'Cambiar imagen' : 'Subir imagen'}<input type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files)} /></label>
        {optional && value && <button type="button" className="ad-btn ghost sm" onClick={() => onChange('')}>Quitar</button>}
      </div>
    </div>
  );
}

function SectionForm({ s, products, onChange }: { s: Section; products: ShopProduct[]; onChange: (p: Partial<Section>) => void }) {
  switch (s.type) {
    case 'hero': return (
      <>
        <TextField label="Frase pequeña de arriba" value={s.eyebrow} onChange={(v) => onChange({ eyebrow: v })} />
        <TextField label="Título grande" hint="Enter para cambiar de línea" rows={2} value={s.title} onChange={(v) => onChange({ title: v })} />
        <TextField label="Subtítulo" rows={2} value={s.subtitle} onChange={(v) => onChange({ subtitle: v })} />
        <TextField label="Texto del botón" hint="vacío = sin botón" value={s.button_text} onChange={(v) => onChange({ button_text: v })} />
        {s.button_text && <LinkField label="El botón lleva a" value={s.button_link} onChange={(v) => onChange({ button_link: v })} />}
        <ImageField label="Foto principal" value={s.image} onChange={(v) => onChange({ image: v })} optional />
        <ImageField label="Logo" value={s.logo} onChange={(v) => onChange({ logo: v })} optional />
        <ImageField label="Fondo" value={s.background} onChange={(v) => onChange({ background: v })} optional />
      </>
    );
    case 'products': return (
      <>
        <TextField label="Frase pequeña de arriba" value={s.eyebrow} onChange={(v) => onChange({ eyebrow: v })} />
        <TextField label="Título" value={s.title} onChange={(v) => onChange({ title: v })} />
        <TextField label="Subtítulo" value={s.subtitle} onChange={(v) => onChange({ subtitle: v })} />
        <div className="ad-field"><span>Qué productos mostrar <small>· ninguno marcado = todos</small></span>
          <div className="ad-ed-checks">
            {products.map((p) => {
              const on = !!s.only?.includes(p.slug);
              return <label key={p.slug}><input type="checkbox" checked={on} onChange={() => onChange({ only: on ? (s.only ?? []).filter((x) => x !== p.slug) : [...(s.only ?? []), p.slug] })} />{p.name}</label>;
            })}
          </div>
        </div>
        <ImageField label="Imagen de fondo" value={s.background} onChange={(v) => onChange({ background: v })} optional />
      </>
    );
    case 'text_image': return (
      <>
        <TextField label="Título" value={s.title} onChange={(v) => onChange({ title: v })} />
        <TextField label="Texto" hint="deja una línea en blanco para separar párrafos" rows={8} value={s.body} onChange={(v) => onChange({ body: v })} />
        <ImageField label="Foto" value={s.image} onChange={(v) => onChange({ image: v })} />
        <div className="ad-field"><span>Foto a la</span>
          <div className="ad-seg"><button type="button" className={!s.reverse ? 'active' : ''} onClick={() => onChange({ reverse: false })}>Izquierda</button><button type="button" className={s.reverse ? 'active' : ''} onClick={() => onChange({ reverse: true })}>Derecha</button></div>
        </div>
        <TextField label="Texto del botón" hint="opcional" value={s.button_text ?? ''} onChange={(v) => onChange({ button_text: v })} />
        {s.button_text && <LinkField label="El botón lleva a" value={s.button_link ?? ''} onChange={(v) => onChange({ button_link: v })} />}
      </>
    );
    case 'text': return (
      <>
        <TextField label="Título" value={s.title} onChange={(v) => onChange({ title: v })} />
        <TextField label="Texto" hint="deja una línea en blanco para separar párrafos" rows={8} value={s.body} onChange={(v) => onChange({ body: v })} />
        <div className="ad-field"><span>Alineación</span>
          <div className="ad-seg"><button type="button" className={s.align === 'center' ? 'active' : ''} onClick={() => onChange({ align: 'center' })}>Centrado</button><button type="button" className={s.align === 'left' ? 'active' : ''} onClick={() => onChange({ align: 'left' })}>Izquierda</button></div>
        </div>
      </>
    );
    case 'image': return (
      <>
        <ImageField label="Imagen" value={s.image} onChange={(v) => onChange({ image: v })} />
        <TextField label="Pie de foto" hint="opcional" value={s.caption} onChange={(v) => onChange({ caption: v })} />
        <LinkField label="Al pulsar la imagen ir a (opcional)" value={s.link} onChange={(v) => onChange({ link: v })} />
        <label className="ad-switch-row"><Switch on={s.wide} onChange={(v) => onChange({ wide: v })} label="Ancho completo" /><span>Ocupar todo el ancho de la pantalla</span></label>
      </>
    );
    case 'banner': return (
      <>
        <TextField label="Título" value={s.title} onChange={(v) => onChange({ title: v })} />
        <TextField label="Texto" rows={2} value={s.body} onChange={(v) => onChange({ body: v })} />
        <div className="ad-field"><span>Color</span>
          <div className="ad-seg">{(['verde', 'naranja', 'crema'] as const).map((c) => <button type="button" key={c} className={s.color === c ? 'active' : ''} onClick={() => onChange({ color: c })}>{c.charAt(0).toUpperCase() + c.slice(1)}</button>)}</div>
        </div>
        <TextField label="Texto del botón" hint="vacío = sin botón" value={s.button_text} onChange={(v) => onChange({ button_text: v })} />
        {s.button_text && <LinkField label="El botón lleva a" value={s.button_link} onChange={(v) => onChange({ button_link: v })} />}
      </>
    );
  }
}
