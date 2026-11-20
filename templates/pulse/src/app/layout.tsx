import type { Metadata } from 'next';
import './globals.css';
import { TikTokProvider } from '@/context/TikTokContext';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Pulse - Make Your Day',
  description: 'Short videos, live shopping and a full shop with order tracking.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        {/* loaded by the browser, not at build: next/font's build-time fetch of TikTok Sans kept failing in CI */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=TikTok+Sans:wght@400..800&display=swap" />
      </head>
      <body>
        <TikTokProvider>
          <AppShell>{children}</AppShell>
        </TikTokProvider>
      </body>
    </html>
  );
}
