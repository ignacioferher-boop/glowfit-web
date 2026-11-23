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
};
export type Page = { slug: string; title: string; content: string };
