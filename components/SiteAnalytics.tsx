'use client';
import { Analytics } from '@vercel/analytics/next';

// Estadísticas de visitas de Vercel: sin cookies y sin datos personales. No cuenta el panel ni páginas privadas.
export default function SiteAnalytics() {
  return <Analytics beforeSend={(e) => (/\/(panel-|vista-previa|opinar|checkout)/.test(new URL(e.url).pathname) ? null : e)} />;
}
