import type { Metadata, Viewport } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { Inter, Noto_Sans_Thai } from 'next/font/google';
import { brand } from '@/config/brand.config';
import { PromoBar } from '@/components/PromoBar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Providers } from '@/components/Providers';
import './globals.css';

const thai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-thai',
  display: 'swap',
});

const latin = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-latin',
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
    <html lang="th" className={`${thai.variable} ${latin.variable}`} style={brandVars}>
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
