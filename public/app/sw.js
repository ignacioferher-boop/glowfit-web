// Service worker de la app de clientes: permite instalarla en el móvil. No guarda datos personales en caché.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => new Response(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;background:#f8f2ea;color:#464e34;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px"><div><h1 style="font-weight:400">Sin conexión</h1><p>Conéctate a internet para abrir tu app Glowfit.</p></div>',
    { headers: { 'content-type': 'text/html; charset=utf-8' } })));
});
