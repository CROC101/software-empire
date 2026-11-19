import type { Metadata, Viewport } from 'next';
import { Figtree } from 'next/font/google';
import './globals.css';
import { LibraryProvider } from '@/context/LibraryContext';
import { SpotifyPlayerProvider } from '@/context/SpotifyPlayerContext';
import SpotifyShell from '@/components/layout/SpotifyShell';

// closest free match for the original's geometric sans
const mix = Figtree({ subsets: ['latin'], weight: ['400', '500', '700', '800', '900'], variable: '--font-mix', display: 'swap' });

export const metadata: Metadata = {
  title: 'Sonora - Web Player: Music, Podcasts and YouTube imports',
  description: 'Premium music player with equalizer, lyrics, queue, lock-screen controls and YouTube imports.',
  manifest: process.env.TEMPLATE_BASE + '/manifest.json',
  appleWebApp: { capable: true, title: 'Sonora', statusBarStyle: 'black-translucent' },
  icons: { icon: process.env.TEMPLATE_BASE + '/icon-192.png', apple: process.env.TEMPLATE_BASE + '/icon-192.png' },
};

export const viewport: Viewport = {
  themeColor: '#121212',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mix.variable}>
      <body>
        <LibraryProvider>
          <SpotifyPlayerProvider>
            <SpotifyShell>{children}</SpotifyShell>
          </SpotifyPlayerProvider>
        </LibraryProvider>
      </body>
    </html>
  );
}
