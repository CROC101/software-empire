import type { Metadata, Viewport } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import localFont from 'next/font/local';
import { brand } from '@/config/brand.config';
import { PromoBar } from '@/components/PromoBar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Providers } from '@/components/Providers';
import './globals.css';

// Noto Sans Thai carries the Latin glyphs too. Bundled locally (OFL, licence beside the file): Google
// serves URLs that next 15's next/font/google loader cannot parse, which crashed the deploy build.
const thai = localFont({
  src: './fonts/NotoSansThai-Variable.woff2',
  weight: '100 900',
  variable: '--font-thai',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${brand.name} | ${brand.tagline}`,
  description: brand.tagline,
  icons: { icon: process.env.TEMPLATE_BASE + '/assets/icons/favicon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: brand.colors.primary,
};

const brandVars = {
  '--brand-primary': brand.colors.primary,
  '--brand-secondary': brand.colors.secondary,
} as CSSProperties;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" className={thai.variable} style={brandVars}>
      <body className="flex min-h-screen flex-col">
        <Providers>
          <PromoBar />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
