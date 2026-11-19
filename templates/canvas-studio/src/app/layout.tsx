import type { Metadata } from 'next';
import { Figtree, Inter, JetBrains_Mono, Oswald, Pacifico, Playfair_Display, Space_Grotesk } from 'next/font/google';
import { CanvaProvider } from '@/context/CanvaContext';
import { AppShell } from '@/components/layout/AppShell';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', style: ['normal', 'italic'], display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald', display: 'swap' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', display: 'swap' });
const pacifico = Pacifico({ subsets: ['latin'], weight: '400', variable: '--font-pacifico', display: 'swap' });
const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree', display: 'swap' });

export const metadata: Metadata = {
  title: 'CanvaCraft Pro — Design anything',
  description: 'Design studio with templates, brand kits, animations and export — every Pro feature unlocked.',
};

// Apply the saved theme before first paint so light-mode users don't see a dark flash.
const themeScript = `try{var s=JSON.parse(localStorage.getItem('canvacraft:v1')||'{}');document.documentElement.dataset.theme=(s.settings&&s.settings.theme)||'dark'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fonts = [inter, playfair, jetbrains, oswald, space, pacifico, figtree].map((f) => f.variable).join(' ');
  return (
    <html lang="en" data-theme="dark" className={fonts} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <CanvaProvider>
          <AppShell>{children}</AppShell>
        </CanvaProvider>
      </body>
    </html>
  );
}
