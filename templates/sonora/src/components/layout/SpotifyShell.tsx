'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import TopNavBar from './TopNavBar';
import LeftLibrarySidebar from './LeftLibrarySidebar';
import RightNowPlayingPanel from './RightNowPlayingPanel';
import MobileBottomNav from './MobileBottomNav';
import MainFooter from './MainFooter';
import PersistentPlayerBar from '@/components/player/PersistentPlayerBar';
import MobileFullScreenPlayer from '@/components/player/MobileFullScreenPlayer';

/** Desktop: header + library | view | now-playing, player bar below. Mobile (<768px): view + mini player + tab bar. */
export default function SpotifyShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const main = useRef<HTMLElement>(null);
  const [panel, setPanel] = useState(false);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    main.current?.scrollTo({ top: 0 });
    setSheet(false);
  }, [path]);

  useEffect(() => {
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      // a sandboxed frame (opaque origin) throws on navigator.serviceWorker
      try { void navigator.serviceWorker.register(process.env.TEMPLATE_BASE + '/sw.js').catch(() => undefined); } catch {}
    }
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-frame">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-1 focus:text-black">
        Skip to main content
      </a>
      <TopNavBar />
      {/* first in source order like the original's markup; `order-last` keeps it visually at the bottom */}
      <PersistentPlayerBar panelOpen={panel} onPanel={() => setPanel((v) => !v)} />
      <div className="flex min-h-0 flex-1 gap-2 px-2 md:pb-2 xl:pr-0">
        <LeftLibrarySidebar />
        <main id="main" ref={main} className="relative min-w-0 flex-1 overflow-y-auto overflow-x-hidden rounded-lg bg-surface">
          {children}
          {!path.startsWith('/lyrics') && <MainFooter />}
        </main>
        <RightNowPlayingPanel open={panel} onToggle={() => setPanel((v) => !v)} />
      </div>
      <MobileBottomNav onExpand={() => setSheet(true)} />
      <MobileFullScreenPlayer open={sheet} onClose={() => setSheet(false)} />
    </div>
  );
}
