import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsApp from '@/components/WhatsApp';
import CookieBanner from '@/components/CookieBanner';
import Announcement from '@/components/Announcement';
import { CartProvider } from '@/components/cart';
import { CurrencyProvider } from '@/components/currency';
import { media } from '@/lib/config';
import SiteAnalytics from '@/components/SiteAnalytics';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Glowfit · Bienestar, belleza y hábitos', template: '%s · Glowfit' },
  description: 'Suplementos Glowfit: fórmulas que te acompañan por dentro y se reflejan por fuera.',
  icons: { icon: media('2026/06/cropped-512X512px-ISOLOGO-GLOWFIT-VERDE-DO.png') },
  openGraph: { siteName: 'Glowfit', locale: 'es_ES', type: 'website', images: [{ url: '/img/og-glowfit.jpg', width: 1200, height: 630, alt: 'Glowfit' }] },
  alternates: { canonical: './' },
  ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION } } : {}),
};

const orgLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${siteUrl}/#org`, name: 'Glowfit', url: siteUrl, logo: media('2026/06/cropped-512X512px-ISOLOGO-GLOWFIT-VERDE-DO.png'), email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@glowfit.group' },
    { '@type': 'WebSite', '@id': `${siteUrl}/#web`, name: 'Glowfit', url: siteUrl, inLanguage: 'es-ES', publisher: { '@id': `${siteUrl}/#org` } },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cardo:wght@400;700&family=Inter:wght@300..700&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd).replace(/</g, '\\u003c') }} />
      </head>
      <body>
        <CurrencyProvider>
        <CartProvider>
          <Announcement />
          <Header />
          <main>{children}</main>
          <Footer />
          <WhatsApp />
          <CookieBanner />
          <SiteAnalytics />
        </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
