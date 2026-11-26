'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Cuenta una visita por página vista (contador propio del panel, sin cookies).
export default function PageTracker() {
  const path = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (!path) return;
    let utm = '';
    try { utm = new URLSearchParams(location.search).get('utm_source') || ''; } catch {}
    const body = JSON.stringify({ p: path, r: first.current ? document.referrer : '', u: first.current ? utm : '' });
    first.current = false;
    try {
      if (navigator.sendBeacon) navigator.sendBeacon('/api/v/', new Blob([body], { type: 'application/json' }));
      else fetch('/api/v/', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } });
    } catch {}
  }, [path]);
  return null;
}
