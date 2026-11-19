'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Bell } from 'lucide-react';
import { useTikTok } from '@/context/TikTokContext';
import { notices } from '@/data/seed-tiktok';
import { Drawer, Toast } from '@/components/common/Overlay';
import LeftSidebar from './LeftSidebar';
import TopHeader from './TopHeader';
import CartDrawer from './CartDrawer';
import CoinModal from './CoinModal';
import { UICtx } from './ui';

export default function AppShell({ children }: { children: ReactNode }) {
  const { collapsed } = useTikTok();
  const path = usePathname();
  const bare = path.startsWith('/live') || path.startsWith('/following') || path.startsWith('/shortdrama') || path.startsWith('/@') || path.startsWith('/%40'); // captured LIVE, Following, Short dramas and creator pages have no header icons
  const [cart, setCart] = useState(false);
  const [coins, setCoins] = useState(false);
  const [bell, setBell] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const toast = useCallback((t: string) => {
    setToastText(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastText(null), 2200);
  }, []);
  const ui = useMemo(() => ({ openCart: () => setCart(true), openCoins: () => setCoins(true), openNotices: () => setBell(true), toast }), [toast]);

  return (
    <UICtx.Provider value={ui}>
      {/* full rail only on wide screens and when not collapsed; icons-only rail otherwise */}
      {!collapsed && <div className="hidden lg:block"><LeftSidebar full /></div>}
      <div className={collapsed ? '' : 'lg:hidden'}><LeftSidebar full={false} /></div>
      <main className={`relative min-h-dvh min-w-0 ml-rail ${collapsed ? '' : 'lg:ml-nav'}`}>{children}</main>
      {!bare && <div className={path === '/' ? 'max-lg:hidden' : ''}><TopHeader /></div> /* captured start page shows no header icons below desktop width */}
      <CartDrawer open={cart} onClose={() => setCart(false)} />
      <CoinModal open={coins} onClose={() => setCoins(false)} />
      <Drawer open={bell} onClose={() => setBell(false)} title="Notifications" width={380}>
        <ul>
          {notices.map((n) => (
            <li key={n.id}>
              <Link href={n.href} onClick={() => setBell(false)} className="flex gap-3 px-4 py-3 hover:bg-pill">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"><Bell size={18} /></span>
                <span className="text-14"><span className="block">{n.text}</span><span className="text-12 text-muted">{n.at}</span></span>
              </Link>
            </li>
          ))}
        </ul>
      </Drawer>
      <Toast text={toastText} />
    </UICtx.Provider>
  );
}
