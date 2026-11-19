import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import { YouTubeProvider } from '@/context/YouTubeContext';
import AppShell from '@/components/layout/AppShell';

const roboto = Roboto({ subsets: ['latin'], weight: ['400', '500', '700', '900'], variable: '--font-roboto' });

export const metadata: Metadata = {
  title: 'ViewTube',
  description: 'Watch, share and discover videos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <YouTubeProvider>
          <AppShell>{children}</AppShell>
        </YouTubeProvider>
      </body>
    </html>
  );
}
