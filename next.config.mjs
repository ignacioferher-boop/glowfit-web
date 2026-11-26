/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  // La guía PDF solo se sirve desde /api/guia (enlace personal), no es pública
  outputFileTracingIncludes: { '/api/guia': ['./private/guia.pdf'] },
  async headers() {
    const security = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests" },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
    ];
    const privatePage = [
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      { key: 'Cache-Control', value: 'no-store' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
    ];
    return [
      { source: '/:path*', headers: security },
      { source: '/panel-7565gaii/:path*', headers: privatePage },
      { source: '/vista-previa/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
    ];
  },
  async redirects() {
    return [
      { source: '/product/:slug', destination: '/producto/:slug/', permanent: true },
      { source: '/productos-3', destination: '/productos/', permanent: true },
      { source: '/tienda', destination: '/productos/', permanent: true },
      { source: '/finalizar-compra', destination: '/carrito/', permanent: true },
      { source: '/cambios-y-devoluciones', destination: '/reembolso_devoluciones/', permanent: true },
      // Artículos del blog ocultos hasta tener texto propio (temporal)
      { source: '/beauty-self-care', destination: '/blog/', permanent: false },
      { source: '/the-glowfit-edit', destination: '/blog/', permanent: false },
    ];
  },
};
export default nextConfig;
