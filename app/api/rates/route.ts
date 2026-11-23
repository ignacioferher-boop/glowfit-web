// Tipos de cambio desde EUR. Se actualizan solos cada 6 horas (fuente: open.er-api.com, gratuita, sin clave).
export const revalidate = 21600;
const WANT = ['USD', 'PEN', 'ARS', 'BOB', 'MXN', 'COP', 'CLP'];

export async function GET() {
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/EUR', { next: { revalidate } });
    const d = await r.json();
    if (d.result !== 'success') throw new Error('rates');
    const rates: Record<string, number> = { EUR: 1 };
    for (const c of WANT) if (typeof d.rates?.[c] === 'number') rates[c] = d.rates[c];
    return Response.json({ rates, updated: d.time_last_update_utc ?? null }, { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' } });
  } catch {
    return Response.json({ rates: { EUR: 1 }, updated: null }, { headers: { 'Cache-Control': 'public, s-maxage=300' } });
  }
}
