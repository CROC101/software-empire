'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell, Coins, Moon, Package, Plus, ShoppingCart, Store, User, MessageCircle } from 'lucide-react';
import { useLookup, useTikTok } from '@/context/TikTokContext';
import { Avatar } from '@/components/common/Visuals';
import { ME } from '@/data/seed-tiktok';
import { useUI } from './ui';

const chip = 'flex h-10 items-center justify-center gap-1.5 rounded-pill border border-line bg-card/90 text-ink shadow-sm backdrop-blur hover:bg-card';

export default function TopHeader() {
  const { cart, coins, hydrated, theme, setTheme } = useTikTok();
  const { creator } = useLookup();
  const { openCart, openCoins, openNotices } = useUI();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const me = creator(ME);
  const count = hydrated ? cart.reduce((a, c) => a + c.qty, 0) : 0;

  useEffect(() => {
    if (!menu) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menu]);

  return (
    <div className="fixed right-3 top-3 z-40 flex items-center gap-1.5 md:right-6 md:top-6 md:gap-2" aria-label="Quick actions">
      <Link href="/upload" className={`${chip} w-10 md:w-auto md:px-4`} aria-label="Upload">
        <Plus size={18} /><span className="hidden text-15 font-semibold md:inline">Upload</span>
      </Link>
      <button onClick={openCart} aria-label={`Shopping cart, ${count} items`} className={`${chip} relative w-10`}>
        <ShoppingCart size={18} />
        {count > 0 && <span className="absolute -right-1 -top-1 min-w-[18px] rounded-pill bg-deal px-1 text-11 leading-[18px] font-bold text-white">{count}</span>}
      </button>
      <button onClick={openCoins} aria-label={`${coins} Coins, recharge`} className={`${chip} w-10 lg:w-auto lg:px-3`}>
        <Coins size={18} className="text-gold" /><span className="hidden text-14 font-semibold lg:inline">{(hydrated ? coins : 1250).toLocaleString('en-US')} Coins</span>
      </button>
      <button onClick={openNotices} aria-label="Notifications" className={`${chip} relative w-10`}>
        <Bell size={18} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand" />
      </button>
      <div className="relative" ref={ref}>
        <button onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label="Account menu" className="flex h-10 w-10 items-center justify-center rounded-full">
          <Avatar hue={me.hue} name={me.name} size={36} className="ring-2 ring-card" />
        </button>
        {menu && (
          <div role="menu" className="absolute right-0 top-12 w-56 rounded-md bg-card py-2 text-ink shadow-[0_2px_12px_rgba(0,0,0,0.16)] ring-1 ring-line">
            <p className="px-4 pb-2 text-13 text-muted">Signed in as <b className="text-ink">@{ME}</b></p>
            {[
              ['/profile', 'View profile', <User key="u" size={18} />],
              ['/orders', 'My Orders & Tracking', <Package key="o" size={18} />],
              ['/messages', 'Messages', <MessageCircle key="m" size={18} />],
              ['/seller', 'Seller Center', <Store key="s" size={18} />],
            ].map(([href, label, icon]) => (
              <Link key={href as string} role="menuitem" href={href as string} onClick={() => setMenu(false)} className="flex h-10 items-center gap-3 px-4 text-15 hover:bg-pill">{icon}{label}</Link>
            ))}
            <button role="menuitem" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex h-10 w-full items-center gap-3 px-4 text-15 hover:bg-pill"><Moon size={18} />Dark mode: {theme === 'dark' ? 'On' : 'Off'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
