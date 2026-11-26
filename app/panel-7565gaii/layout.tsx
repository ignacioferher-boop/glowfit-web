import type { Metadata, Viewport } from 'next';
export const metadata: Metadata = {
  title: 'Panel', robots: { index: false, follow: false },
  manifest: '/panel-7565gaii/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Glowfit Panel', statusBarStyle: 'default' },
  icons: { apple: '/img/panel-icon-180.png' },
};
export const viewport: Viewport = { themeColor: '#464e34' };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
