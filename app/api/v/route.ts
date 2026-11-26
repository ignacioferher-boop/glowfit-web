import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/data';
import { clientIp } from '@/lib/ratelimit';

// Contador de visitas propio: sin cookies ni datos personales.
// El visitante es un resumen (hash) de IP + navegador + día que cambia cada día y no se puede revertir.
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|vercel|curl|wget|python|monitor/i;
const PRIVATE = /^\/(panel-|vista-previa|api\/|app\/|opinar|seguimiento)/;

function source(ref: string, utm: string, host: string) {
  const s = (utm || '').toLowerCase();
  let h = '';
  try { h = ref ? new URL(ref).hostname.replace(/^www\./, '') : ''; } catch {}
  if (h && (h === host || h.endsWith('glowfit.group'))) h = '';
  const t = s || h;
  if (!t) return '';
  if (/instagram|^ig$/.test(t)) return 'Instagram';
  if (/facebook|fb\.|^fb$/.test(t)) return 'Facebook';
  if (/tiktok/.test(t)) return 'TikTok';
  if (/whatsapp|wa\.me/.test(t)) return 'WhatsApp';
  if (/google/.test(t)) return 'Google';
  if (/bing|duckduckgo|yahoo|ecosia/.test(t)) return 'Otros buscadores';
  if (/stripe/.test(t)) return '';
  return t.slice(0, 40);
}

export async function POST(req: Request) {
  try {
    const ua = req.headers.get('user-agent') || '';
    const secret = process.env.ORDER_SECRET;
    if (!secret || !supabasePublic || !ua || BOT.test(ua)) return new NextResponse(null, { status: 204 });
    const b = await req.json().catch(() => ({})) as { p?: string; r?: string; u?: string };
    const path = String(b.p || '/').split('?')[0].slice(0, 200);
    if (PRIVATE.test(path)) return new NextResponse(null, { status: 204 });
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
    const visitor = createHash('sha256').update(`${clientIp(req)}|${ua}|${day}|${secret}`).digest('hex').slice(0, 32);
    const device = /ipad|tablet/i.test(ua) ? 'Tablet' : /mobi|iphone|android/i.test(ua) ? 'Móvil' : 'Ordenador';
    const host = new URL(req.url).hostname.replace(/^www\./, '');
    await supabasePublic.rpc('track_view', { p_secret: secret, p_path: path, p_visitor: visitor, p_source: source(String(b.r || ''), String(b.u || ''), host), p_device: device });
  } catch (e) { console.error('visitas', (e as Error).message); }
  return new NextResponse(null, { status: 204 });
}
