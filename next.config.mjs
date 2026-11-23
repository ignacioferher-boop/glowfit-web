/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  async redirects() {
    return [
      { source: '/product/:slug', destination: '/producto/:slug/', permanent: true },
      { source: '/productos-3', destination: '/productos/', permanent: true },
      { source: '/tienda', destination: '/productos/', permanent: true },
      { source: '/finalizar-compra', destination: '/carrito/', permanent: true },
    ];
  },
};
export default nextConfig;
