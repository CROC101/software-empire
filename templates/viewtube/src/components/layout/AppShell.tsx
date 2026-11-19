'use client';

import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useYouTube } from '@/context/YouTubeContext';
import { Toaster } from '@/components/ui';
import { cx } from '@/lib/format';
import TopHeader from './TopHeader';
import MiniPlayer from './MiniPlayer';
import { Drawer, FullNav, MiniRail, normalize } from './Sidebar';

export default function AppShell({ children }: { children: ReactNode }) {
  const { hydrated, sidebarFull, setDrawerOpen } = useYouTube();
  const path = normalize(usePathname());
  // The watch and shorts pages use the full width; their guide opens as an overlay drawer.
  const bare = path === '/watch' || path === '/shorts';

  useEffect(() => setDrawerOpen(false), [path, setDrawerOpen]);

  return (
    <>
      <TopHeader />
      {!bare && (
        <>
          {sidebarFull && (
            <aside className="thin-scroll fixed top-14 bottom-0 left-0 z-30 hidden w-[240px] overflow-y-auto bg-canvas xl:block">
              <FullNav />
            </aside>
          )}
          <div className={cx(sidebarFull && 'xl:hidden')}>
            <MiniRail />
          </div>
        </>
      )}
      <Drawer />
      <main className={cx('min-h-screen pt-14', !bare && (sidebarFull ? 'md:pl-[72px] xl:pl-[240px]' : 'md:pl-[72px]'))}>
        {hydrated ? children : <div className="h-[calc(100vh-56px)]" aria-busy="true" />}
      </main>
      <MiniPlayer />
      <Toaster />
    </>
  );
}
