export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  short_description: string | null;
  description: string | null;
  price_cents: number;
  images: string[];
  sort: number;
  tagline?: string | null;
  /** Unidades que se pueden vender. null = sin control de stock. En packs, lo que permiten sus productos. */
  available?: number | null;
};
export type Page = { slug: string; title: string; content: string };
