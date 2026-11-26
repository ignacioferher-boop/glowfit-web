import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/data';

export const dynamic = 'force-dynamic';

// Estado actual de los productos que se venden (precio y unidades disponibles) para sincronizar los carritos guardados.
export async function GET() {
  const products = await getProducts();
  return NextResponse.json(
    products.map((p) => ({ slug: p.slug, name: p.name, price_cents: p.price_cents, available: p.available ?? null })),
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
