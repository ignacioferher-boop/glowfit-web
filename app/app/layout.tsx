import type { Metadata, Viewport } from 'next';
import './app.css';

export const metadata: Metadata = {
  title: 'Tu app Glowfit',
  robots: { index: false, follow: false },
  manifest: '/app/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Glowfit', statusBarStyle: 'default' },
  icons: { apple: '/img/app-icon-180.png' },
};
export const viewport: Viewport = { themeColor: '#f8f2ea', viewportFit: 'cover', width: 'device-width', initialScale: 1 };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
