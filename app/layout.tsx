import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsApp from '@/components/WhatsApp';
import CookieBanner from '@/components/CookieBanner';
import { CartProvider } from '@/components/cart';
import { media } from '@/lib/config';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Glowfit · Bienestar, belleza y hábitos', template: '%s · Glowfit' },
  description: 'Suplementos Glowfit: fórmulas que te acompañan por dentro y se reflejan por fuera.',
  icons: { icon: media('2026/06/cropped-512X512px-ISOLOGO-GLOWFIT-VERDE-DO.png') },
  openGraph: { siteName: 'Glowfit', locale: 'es_ES', type: 'website', images: [media('2026/11/3-edited-scaled.png')] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cardo:wght@400;700&family=Inter:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <WhatsApp />
          <CookieBanner />
        </CartProvider>
      </body>
    </html>
  );
}
