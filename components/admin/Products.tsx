'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { sb } from '@/lib/supabase-browser';
import { Empty, Icon, Modal, Skeleton, Switch, eur, useToast, type Product } from './ui';

const htmlToText = (h: string | null) => (h ?? '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>\s*<p[^>]*>/gi, '\n\n').replace(/<li[^>]*>/gi, '• ').replace(/<\/li>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n').trim();
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const textToHtml = (t: string) => (t.trim() ? t.trim().split(/\n{2,}/).map((b) => `<p>${esc(b).replace(/\n/g, '<br />')}</p>`).join('') : null);
const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const EMPTY: Product = { slug: '', name: '', category: 'Vitaminas', tagline: '', short_description: '', description: '', price_cents: 0, images: [], active: true, sort: 99 };

export default function Products() {
  const toast = useToast();
  const [items, setItems] = useState<Product[] | null>(null);
  const [edit, setEdit] = useState<Product | null>(null);
  const [del, setDel] = useState<Product | null>(null);
  const [q, setQ] = useState('');
  const load = useCallback(async () => {
    const { data } = await sb().from('products').select('*').order('sort');
    setItems((data as Product[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const list = useMemo(() => (items ?? []).filter((p) => !q || `${p.name} ${p.category}`.toLowerCase().includes(q.toLowerCase())), [items, q]);

  async function toggle(p: Product, v: boolean) {
    setItems((l) => l?.map((x) => (x.id === p.id ? { ...x, active: v } : x)) ?? null);
    const { error } = await sb().from('products').update({ active: v }).eq('id', p.id!);
    if (error) { toast('No se pudo cambiar la visibilidad', 'err'); load(); } else toast(v ? `${p.name} ya se ve en la tienda` : `${p.name} oculto de la tienda`);
  }
  async function duplicate(p: Product) {
    const { id: _id, ...rest } = p;
    const copy = { ...rest, name: `${p.name} (copia)`, slug: `${p.slug}-copia-${Date.now().toString(36).slice(-4)}`, active: false, sort: (items?.length ?? 0) + 1 };
    const { error } = await sb().from('products').insert(copy);
    if (error) return toast('No se pudo duplicar', 'err');
    toast('Producto duplicado (oculto hasta que lo revises)'); load();
  }
  async function remove(p: Product) {
    const { error } = await sb().from('products').delete().eq('id', p.id!);
    setDel(null);
    if (error) return toast('No se pudo eliminar', 'err');
    toast(`${p.name} eliminado`); load();
  }

  if (!items) return <Skeleton rows={5} h={88} />;
  if (edit) return <ProductEditor initial={edit} onDone={(saved) => { setEdit(null); if (saved) { toast('Producto guardado. Se verá en la web en unos minutos.'); load(); } }} />;
  return (
    <>
      <div className="ad-toolbar ad-rise">
        <div className="ad-search"><Icon name="search" /><input type="search" placeholder="Buscar producto" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar producto" /></div>
        <button className="ad-btn primary" onClick={() => setEdit({ ...EMPTY, sort: items.length + 1 })}><Icon name="plus" />Nuevo producto</button>
      </div>
      {items.length === 0 ? <div className="ad-card"><Empty icon="box" title="No hay productos" text="Añade tu primer producto para que aparezca en la tienda." /></div> : (
        <ul className="ad-products">
          {list.map((p, i) => (
            <li key={p.id} className={`ad-pcard ad-rise${p.active ? '' : ' off'}`} style={{ animationDelay: `${i * 40}ms` }}>
              <button className="ad-pimg" onClick={() => setEdit(p)} aria-label={`Editar ${p.name}`}>
                {p.images?.[0] ? <img src={p.images[0]} alt="" /> : <Icon name="image" size={28} />}
                {!p.active && <span className="ad-tag">Oculto</span>}
              </button>
              <div className="ad-pbody">
                <small className="ad-muted">{p.category}</small>
                <strong>{p.name}</strong>
                <span className="ad-price">{eur(p.price_cents)}</span>
              </div>
              <div className="ad-pfoot">
                <label className="ad-switch-row"><Switch on={p.active} onChange={(v) => toggle(p, v)} label={`Mostrar ${p.name} en la tienda`} /><span>{p.active ? 'Visible' : 'Oculto'}</span></label>
                <div className="ad-pactions">
                  <button className="ad-icon-btn" onClick={() => setEdit(p)} aria-label={`Editar ${p.name}`} title="Editar"><Icon name="edit" /></button>
                  <button className="ad-icon-btn" onClick={() => duplicate(p)} aria-label={`Duplicar ${p.name}`} title="Duplicar"><Icon name="copy" /></button>
                  <button className="ad-icon-btn danger" onClick={() => setDel(p)} aria-label={`Eliminar ${p.name}`} title="Eliminar"><Icon name="trash" /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {del && (
        <Modal title={`¿Eliminar «${del.name}»?`} onClose={() => setDel(null)}>
          <p className="ad-muted">Se borrará de la tienda y del panel para siempre. Los pedidos antiguos que lo incluyen no se modifican. Si solo quieres quitarlo un tiempo, mejor <strong>ocúltalo</strong>.</p>
          <div className="ad-modal-actions">
            <button className="ad-btn" onClick={() => { toggle(del, false); setDel(null); }} data-autofocus>Ocultar en vez de borrar</button>
            <button className="ad-btn danger" onClick={() => remove(del)}><Icon name="trash" />Eliminar {del.name}</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function ProductEditor({ initial, onDone }: { initial: Product; onDone: (saved: boolean) => void }) {
  const toast = useToast();
  const [p, setP] = useState<Product>({ ...initial, tagline: initial.tagline ?? '', short_description: htmlToText(initial.short_description), description: htmlToText(initial.description) });
  const [price, setPrice] = useState(initial.price_cents ? (initial.price_cents / 100).toFixed(2).replace('.', ',') : '');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragI, setDragI] = useState<number | null>(null);
  const set = <K extends keyof Product>(k: K, v: Product[K]) => { setP((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };
  const isNew = !initial.id;
  const cents = Math.round(Number(price.replace(/\./g, '').replace(',', '.')) * 100) || 0;

  async function upload(files: FileList | File[] | null) {
    if (!files || !('length' in files) || !files.length) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    setUploading(arr.length);
    const now = new Date();
    const urls: string[] = [];
    for (const f of arr) {
      if (f.size > 8 * 1024 * 1024) { toast(`${f.name} pesa más de 8 MB`, 'err'); setUploading((n) => n - 1); continue; }
      const ext = f.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${Date.now()}-${slugify(f.name.replace(/\.[^.]+$/, '')) || 'foto'}.${ext}`;
      const { error } = await sb().storage.from('media').upload(path, f, { contentType: f.type });
      if (error) toast(`No se pudo subir ${f.name}`, 'err');
      else urls.push(sb().storage.from('media').getPublicUrl(path).data.publicUrl);
      setUploading((n) => n - 1);
    }
    setP((x) => ({ ...x, images: [...x.images, ...urls] }));
    setErrors((e) => ({ ...e, images: '' }));
  }
  function reorder(from: number, to: number) {
    if (from === to || to < 0 || to >= p.images.length) return;
    const a = [...p.images]; const [m] = a.splice(from, 1); a.splice(to, 0, m); set('images', a);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!p.name.trim()) err.name = 'Escribe el nombre';
    if (cents < 50) err.price = 'Escribe un precio, por ejemplo 29,90';
    if (!p.images.length) err.images = 'Añade al menos una foto';
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    const row = { name: p.name.trim(), slug: p.slug || slugify(p.name), category: p.category || null, tagline: p.tagline?.trim() || null, short_description: textToHtml(p.short_description ?? ''), description: textToHtml(p.description ?? ''), price_cents: cents, images: p.images, active: p.active, sort: p.sort };
    const { error } = isNew ? await sb().from('products').insert(row) : await sb().from('products').update(row).eq('id', p.id!);
    setBusy(false);
    if (error) { toast(error.message.includes('duplicate') ? 'Ya hay un producto con ese nombre. Cámbialo un poco.' : 'No se pudo guardar', 'err'); return; }
    onDone(true);
  }

  return (
    <form className="ad-editor ad-rise" onSubmit={save} noValidate>
      <div className="ad-editor-head">
        <button type="button" className="ad-btn ghost" onClick={() => onDone(false)}><Icon name="left" />Productos</button>
        <h2>{isNew ? 'Nuevo producto' : p.name || 'Editar producto'}</h2>
        <div className="ad-editor-actions"><button type="button" className="ad-btn" onClick={() => onDone(false)}>Cancelar</button><button className="ad-btn primary" disabled={busy || uploading > 0}>{busy ? <span className="ad-spinner sm" /> : <Icon name="check" />}Guardar</button></div>
      </div>
      <div className="ad-editor-grid">
        <div className="ad-editor-main">
          <section className="ad-card">
            <h3>Información</h3>
            <label className="ad-field"><span>Nombre</span><input value={p.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} placeholder="Ej. Bloom" />{errors.name && <em className="ad-err">{errors.name}</em>}</label>
            <label className="ad-field"><span>Frase corta bajo el nombre <small>(para qué sirve · {110 - (p.tagline?.length ?? 0)} caracteres)</small></span><input value={p.tagline ?? ''} maxLength={110} onChange={(e) => set('tagline', e.target.value)} placeholder="Ej. Drenante: ayuda a eliminar líquidos retenidos e hinchazón." /></label>
            <label className="ad-field"><span>Descripción principal</span><textarea rows={5} value={p.short_description ?? ''} onChange={(e) => set('short_description', e.target.value)} placeholder="Lo que verá el cliente junto al precio" /></label>
            <label className="ad-field"><span>Más información <small>(modo de empleo, ingredientes…)</small></span><textarea rows={6} value={p.description ?? ''} onChange={(e) => set('description', e.target.value)} /></label>
          </section>
          <section className="ad-card">
            <h3>Fotos <small className="ad-muted">· arrastra para ordenar, la primera es la principal</small></h3>
            <ul className="ad-images">
              {p.images.map((src, i) => (
                <li key={src} draggable onDragStart={() => setDragI(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragI !== null) reorder(dragI, i); setDragI(null); }} className={dragI === i ? 'dragging' : ''}>
                  <img src={src} alt="" />{i === 0 && <span className="ad-tag">Principal</span>}
                  <div className="ad-img-actions">
                    <button type="button" onClick={() => reorder(i, i - 1)} disabled={i === 0} aria-label="Mover antes"><Icon name="left" size={14} /></button>
                    <button type="button" onClick={() => reorder(i, i + 1)} disabled={i === p.images.length - 1} aria-label="Mover después"><Icon name="right" size={14} /></button>
                    <button type="button" onClick={() => set('images', p.images.filter((x) => x !== src))} aria-label="Quitar foto" className="danger"><Icon name="trash" size={14} /></button>
                  </div>
                </li>
              ))}
              {Array.from({ length: uploading }).map((_, i) => <li key={`u${i}`} className="ad-skel" />)}
              <li className="ad-drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}>
                <label><Icon name="image" size={24} /><span>Subir fotos</span><small>o arrástralas aquí</small><input type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} /></label>
              </li>
            </ul>
            {errors.images && <em className="ad-err">{errors.images}</em>}
          </section>
        </div>
        <aside className="ad-editor-side">
          <section className="ad-card">
            <h3>Precio y estado</h3>
            <label className="ad-field"><span>Precio con IVA</span><span className="ad-input-suffix"><input inputMode="decimal" value={price} onChange={(e) => { setPrice(e.target.value); setErrors((x) => ({ ...x, price: '' })); }} aria-invalid={!!errors.price} placeholder="29,90" /><b>€</b></span>{errors.price && <em className="ad-err">{errors.price}</em>}</label>
            <label className="ad-field"><span>Categoría</span><input value={p.category ?? ''} onChange={(e) => set('category', e.target.value)} list="ad-cats" /><datalist id="ad-cats"><option value="Vitaminas" /><option value="PACKS" /></datalist></label>
            <label className="ad-field"><span>Posición en la tienda</span><input type="number" min={0} value={p.sort} onChange={(e) => set('sort', Number(e.target.value))} /></label>
            <label className="ad-switch-row big"><Switch on={p.active} onChange={(v) => set('active', v)} label="Visible en la tienda" /><span>{p.active ? 'Visible en la tienda' : 'Oculto en la tienda'}</span></label>
          </section>
          <section className="ad-card">
            <h3>Vista previa</h3>
            <div className="ad-preview">
              <div className="ad-preview-img">{p.images[0] ? <img src={p.images[0]} alt="" /> : <Icon name="image" size={32} />}</div>
              <small>{(p.category || 'Categoría').toUpperCase()}</small>
              <strong>{p.name || 'Nombre del producto'}</strong>
              <p>{p.tagline || 'Aquí va la frase corta de para qué sirve.'}</p>
              <span>{cents ? eur(cents) : '0,00 €'}</span>
              <i>Añadir al carrito</i>
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
