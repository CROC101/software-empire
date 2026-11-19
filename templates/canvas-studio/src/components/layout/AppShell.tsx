'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { LeftNavRail } from './LeftNavRail';
import { TopHeader } from './TopHeader';

const FULLSCREEN = ['/design/', '/present/', '/en/help/'];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname() ?? '/';
  if (FULLSCREEN.some((p) => path.startsWith(p))) return <>{children}</>;
  return (
    <div className="min-h-screen md:pl-[72px]">
      <LeftNavRail />
      <TopHeader />
      <main className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-6 md:px-8 md:pb-12">{children}</main>
    </div>
  );
}
