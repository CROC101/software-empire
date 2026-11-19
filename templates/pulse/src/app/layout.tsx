import type { Metadata } from 'next';
import { TikTok_Sans } from 'next/font/google';
import './globals.css';
import { TikTokProvider } from '@/context/TikTokContext';
import AppShell from '@/components/layout/AppShell';

const font = TikTok_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-tiktok', display: 'swap' });

export const metadata: Metadata = {
  title: 'Pulse - Make Your Day',
  description: 'Short videos, live shopping and a full shop with order tracking.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={font.variable} suppressHydrationWarning>
      <body>
        <TikTokProvider>
          <AppShell>{children}</AppShell>
        </TikTokProvider>
      </body>
    </html>
  );
}
