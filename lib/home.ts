import { media } from './config';
import { getSetting } from './settings';

export type SectionType = 'hero' | 'products' | 'text_image' | 'text' | 'image' | 'banner';
type Base = { id: string; type: SectionType; hidden?: boolean };
export type HeroSection = Base & { type: 'hero'; logo: string; eyebrow: string; title: string; subtitle: string; button_text: string; button_link: string; image: string; background: string };
export type ProductsSection = Base & { type: 'products'; eyebrow: string; title: string; subtitle: string; background: string; only?: string[] };
export type TextImageSection = Base & { type: 'text_image'; title: string; body: string; image: string; reverse: boolean; button_text?: string; button_link?: string };
export type TextSection = Base & { type: 'text'; title: string; body: string; align: 'left' | 'center' };
export type ImageSection = Base & { type: 'image'; image: string; caption: string; link: string; wide: boolean };
export type BannerSection = Base & { type: 'banner'; title: string; body: string; button_text: string; button_link: string; color: 'verde' | 'naranja' | 'crema' | 'negro' };
export type Section = HeroSection | ProductsSection | TextImageSection | TextSection | ImageSection | BannerSection;

export type Announcement = { enabled: boolean; text: string; link: string; color?: 'verde' | 'negro' | 'naranja' };
export type HomeContent = { sections: Section[]; announcement: Announcement };

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Portada',
  products: 'Productos',
  text_image: 'Texto con imagen',
  text: 'Texto',
  image: 'Imagen',
  banner: 'Franja destacada',
};

export const DEFAULT_HOME: HomeContent = {
  announcement: { enabled: false, text: 'Envíos a toda España en 2–4 días laborables', link: '/productos/' },
  sections: [
    {
      id: 'hero', type: 'hero', logo: media('2026/05/LOGO-GLOWFIT.png'), eyebrow: 'BIENESTAR . BELLEZA . HÁBITOS',
      title: 'TU BIENESTAR\nTU GLOW', subtitle: 'Fórmulas que te acompañan por dentro y se reflejan por fuera.',
      button_text: 'DESCUBRE TU GLOW >', button_link: '/productos/', image: media('2026/11/3-edited-scaled.png'), background: media('2026/05/FONDO-COLOR-scaled.png'),
    },
    {
      id: 'favoritos', type: 'products', eyebrow: 'SUPLEMENTOS', title: 'NUESTROS FAVORITOS',
      subtitle: 'Fórmulas pensadas para acompañarte en tu rutina de bienestar.', background: media('2026/10/bienestar.png'),
    },
    {
      id: 'nosotros', type: 'text_image', title: 'CONOCE UN POCO SOBRE NOSOTROS', reverse: false, image: media('2026/06/4-300x300-1.png'),
      body: 'Glowfit nació de nosotros.\nDe nuestra forma de cuidarnos, de entrenar, de viajar y de disfrutar la vida.\nDe buscar sentirnos bien por dentro para reflejarlo por fuera.\n\nAsí nació Glowfit: una marca creada para acompañarte a sentirte bien, cuidarte y brillar desde dentro.',
    },
    {
      id: 'suplementos', type: 'text_image', title: 'SUPLEMENTOS CREADOS PARA TU BIENESTAR', reverse: true, image: media('2026/06/FOTOS-CUADRADA-2.png'),
      body: 'Nuestra línea de suplementos combina ingredientes cuidadosamente seleccionados y fórmulas desarrolladas para acompañarte en tu día a día.\n\nDesde fórmulas pensadas para complementar tus objetivos de control de peso y bienestar, hasta complementos destinados al cuidado digestivo, la belleza y el equilibrio del organismo.\n\nCada producto Glowfit nace con un mismo propósito: ayudarte a cuidar de ti, sentirte bien y mantener un estilo de vida saludable.',
    },
  ],
};

export function newSection(type: SectionType): Section {
  const id = `${type}-${Math.random().toString(36).slice(2, 8)}`;
  switch (type) {
    case 'hero': return { ...(DEFAULT_HOME.sections[0] as HeroSection), id };
    case 'products': return { id, type, eyebrow: 'SUPLEMENTOS', title: 'NUESTROS PRODUCTOS', subtitle: '', background: '' };
    case 'text_image': return { id, type, title: 'TÍTULO DE LA SECCIÓN', body: 'Escribe aquí tu texto.', image: media('2026/06/FOTOS-CUADRADA-2.png'), reverse: false, button_text: '', button_link: '' };
    case 'text': return { id, type, title: 'TÍTULO', body: 'Escribe aquí tu texto.', align: 'center' };
    case 'image': return { id, type, image: media('2026/11/3-edited-scaled.png'), caption: '', link: '', wide: false };
    case 'banner': return { id, type, title: 'ENVÍOS A TODA ESPAÑA', body: 'Recíbelo en 2–4 días laborables en toda España.', button_text: 'VER PRODUCTOS', button_link: '/productos/', color: 'verde' };
  }
}

export async function getHome(): Promise<HomeContent> {
  const v = await getSetting<Partial<HomeContent> | null>('home', null);
  if (!v || !Array.isArray(v.sections)) return DEFAULT_HOME;
  return { sections: v.sections as Section[], announcement: { ...DEFAULT_HOME.announcement, ...(v.announcement ?? {}) } };
}
