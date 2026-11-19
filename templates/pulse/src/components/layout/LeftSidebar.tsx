'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import {
  ArrowLeft, Clapperboard, Compass, Ellipsis, Home, Image as ImageIcon, MessageCircle, Moon, Package, PanelLeftClose, PanelLeftOpen,
  Search, ShoppingBag, SquarePlay, SquarePlus, Store, Tv, User, UserCheck, UserRound, Users, Video, Wrench, RotateCcw, Coins,
} from 'lucide-react';
import { useTikTok } from '@/context/TikTokContext';
import { Logo, LogoMark } from '@/components/common/Visuals';
import { orderTab } from '@/lib/format';
import { liveStreams, ME } from '@/data/seed-tiktok';
import { useUI } from './ui';

interface Item { href: string; label: string; icon: ReactNode; badge?: ReactNode; match?: (p: string) => boolean }

export default function LeftSidebar({ full }: { full: boolean }) {
  const path = usePathname() || '/';
  const router = useRouter();
  const { orders, threads, collapsed, toggleCollapsed, theme, setTheme, resetDemo, hydrated } = useTikTok();
  const { openCoins, toast } = useUI();
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [pop, setPop] = useState<string | null>(null);
  const [popTop, setPopTop] = useState(0);
  // pop-ups are position:fixed because the sidebar itself scrolls (and would clip them)
  const popStyle = { top: popTop, left: full ? 208 : 56 };
  const [moreOpen, setMoreOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const isLive = path.startsWith('/live');

  const active = hydrated ? orders.filter((o) => orderTab(o) === 'to_receive' || orderTab(o) === 'to_ship').length : 0;
  const unread = hydrated ? threads.reduce((a, t) => a + t.unread, 0) : 0;
  const pill = (n: number, cls = 'bg-brand') => (n > 0 ? <span className={`ml-auto rounded-pill px-1.5 text-11 leading-4 font-bold text-white ${cls}`}>{n}</span> : null);

  const items: Item[] = isLive
    ? [
      { href: '/live', label: 'Discover LIVE', icon: <Tv size={24} />, match: (p) => p.startsWith('/live') },
      { href: '/upload', label: 'Go LIVE', icon: <Video size={24} />, match: () => false },
      { href: '/seller', label: 'Creator tools', icon: <SquarePlay size={24} />, match: () => false },
    ]
    : [
      // first seven follow the captured rail order; commerce items sit below
      { href: '/', label: 'For You', icon: <Home size={24} />, match: (p) => p === '/' },
      { href: '/explore', label: 'Explore', icon: <Compass size={24} /> },
      { href: '/following', label: 'Following', icon: <UserCheck size={24} /> },
      { href: '/shortdrama', label: 'Short dramas', icon: <Clapperboard size={24} /> },
      { href: '/live', label: 'LIVE', icon: <Tv size={24} /> },
      { href: '/upload', label: 'Upload', icon: <SquarePlus size={24} /> },
      { href: '/profile', label: 'Profile', icon: <User size={24} />, match: (p) => p.startsWith('/profile') || p.startsWith(`/@${ME}`) },
      { href: '/shop', label: 'Shop', icon: <ShoppingBag size={24} />, badge: <span className="ml-auto rounded-sm bg-deal px-1 text-11 leading-4 font-bold text-white">FLASH</span>, match: (p) => p.startsWith('/shop') || p.startsWith('/cart') || p.startsWith('/checkout') },
      { href: '/friends', label: 'Friends', icon: <Users size={24} /> },
      { href: '/messages', label: 'Messages', icon: <MessageCircle size={24} />, badge: pill(unread) },
      { href: '/orders', label: 'My Orders & Tracking', icon: <Package size={24} />, badge: pill(active, 'bg-deal') },
      { href: '/seller', label: 'Seller Center', icon: <Store size={24} /> },
    ];

  const isOn = (it: Item) => (it.match ? it.match(path) : path.startsWith(it.href));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <aside
      className={`group/side fixed left-0 top-0 z-50 flex h-dvh flex-col overflow-y-auto overflow-x-hidden bg-canvas no-scrollbar ${full ? 'w-nav' : 'w-rail border-r border-line'}`}
      aria-label="Main navigation"
    >
      {/* logo row */}
      <div className="relative h-16 shrink-0">
        <Link href="/" aria-label="Pulse home" className={`absolute top-5 ${full ? 'left-6' : 'left-[22px]'}`}>
          {full ? <Logo /> : <LogoMark size={28} />}
        </Link>
        <button
          aria-label="Collapse sidebar"
          aria-expanded={!collapsed}
          onClick={toggleCollapsed}
          className={`absolute hidden h-5 w-5 items-center justify-center text-muted hover:text-ink lg:flex ${full ? 'left-[204px] top-6' : 'left-[50px] top-1 opacity-0 group-hover/side:opacity-100'}`}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      {/* search / back */}
      {isLive ? (
        <Link href="/" className={`mx-4 flex h-10 shrink-0 items-center gap-3 text-17 font-medium text-ink ${full ? 'px-2' : 'justify-center'}`}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pill"><ArrowLeft size={14} /></span>
          {full && 'Back'}
        </Link>
      ) : full ? (
        <form role="search" action="/search" onSubmit={submit} className="mx-4 flex h-10 shrink-0 items-center gap-2 rounded-pill bg-pill px-[11px] focus-within:ring-1 focus-within:ring-line">
          <button type="submit" aria-label="Search" className="text-muted"><Search size={19} /></button>
          <input name="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search" className="min-w-0 flex-1 bg-transparent text-16 text-ink outline-none placeholder:text-muted" />
        </form>
      ) : (
        <button aria-label="Search" onClick={() => setSearchOpen(true)} className="mx-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pill text-ink/70">
          <Search size={19} />
        </button>
      )}

      <nav className={`mt-3 flex flex-col gap-1 px-4 ${isLive ? 'mt-[14px]' : ''}`}>
        {(full ? items : items.slice(0, 7)).map((it) => { // icons-only rail keeps the captured seven; the rest move into More
          const on = isOn(it);
          // Upload and LIVE open a small pop-up first (hover or click), like the captured Upload menu
          const popKey = isLive ? null : it.href === '/upload' ? 'upload' : it.href === '/live' ? 'live' : null;
          const open = popKey !== null && pop === popKey;
          return (
            <div key={it.label} className="relative" onMouseEnter={(e) => { if (popKey) { setPopTop(e.currentTarget.getBoundingClientRect().top); setPop(popKey); } }} onMouseLeave={() => popKey && setPop(null)} onKeyDown={(e) => { if (e.key === 'Escape') setPop(null); }}>
              <Link
                href={it.href}
                aria-current={on ? 'page' : undefined}
                title={full ? undefined : it.label}
                aria-label={full ? undefined : it.label}
                aria-haspopup={popKey ? 'dialog' : undefined}
                aria-expanded={popKey ? open : undefined}
                onClick={(e) => { if (popKey) { e.preventDefault(); setPopTop(e.currentTarget.getBoundingClientRect().top); setPop(popKey); } }}
                className={`flex h-10 items-center rounded-md hover:bg-pill ${full ? 'w-[208px] gap-3 px-1' : 'w-10 justify-center'} ${on ? 'text-brand' : 'text-ink'}`}
              >
                <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center ${on ? '[&_svg]:fill-brand/15' : ''}`}>
                  {it.icon}
                  {!full && it.badge && <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-brand" />}
                </span>
                {full && <h2 className="truncate text-18 leading-[23px] font-semibold">{it.label}</h2>}
                {full && it.badge}
              </Link>
              {open && popKey === 'upload' && (
                <div role="dialog" aria-label="Upload" style={popStyle} className="fixed z-[60] w-[234px] border-l-[5px] border-transparent bg-clip-padding"><div className="rounded-md bg-card py-2 text-ink shadow-[0_2px_12px_rgba(0,0,0,0.12)] ring-1 ring-line">
                  <Link href="/upload" className="flex h-[47px] items-center gap-2 px-[18px] text-16 font-medium hover:bg-pill"><Video size={20} />Videos</Link>
                  <Link href="/upload?type=photo" className="flex h-[47px] items-center gap-2 px-[18px] text-16 font-medium hover:bg-pill"><ImageIcon size={20} />Photos</Link></div>
                </div>
              )}
              {open && popKey === 'live' && (
                <div role="dialog" aria-label="LIVE now" style={popStyle} className="fixed z-[60] w-[265px] border-l-[5px] border-transparent bg-clip-padding"><div className="rounded-md bg-card py-2 text-ink shadow-[0_2px_12px_rgba(0,0,0,0.12)] ring-1 ring-line">
                  <p className="px-4 pb-1 text-13 font-semibold text-muted">LIVE now</p>
                  {liveStreams.map((s) => (
                    <Link key={s.id} href="/live" className="flex h-11 items-center gap-2 px-4 text-14 hover:bg-pill"><span className="rounded-sm bg-brand px-1 text-11 font-bold text-white">LIVE</span><span className="truncate">{s.title}</span></Link>
                  ))}
                  <Link href="/live" className="flex h-10 items-center px-4 text-14 font-semibold text-brand hover:bg-pill">See all LIVE</Link></div>
                </div>
              )}
            </div>
          );
        })}
        <div className="relative">
          <button onClick={() => setMoreOpen((o) => !o)} aria-expanded={moreOpen} className={`flex h-10 items-center rounded-md text-ink hover:bg-pill ${full ? 'w-[208px] gap-3 px-1' : 'w-10 justify-center'}`}>
            <span className="relative flex h-8 w-8 items-center justify-center"><Ellipsis size={19} /><span className="absolute right-[3px] top-[5px] h-1.5 w-1.5 rounded-full bg-brand" /></span>
            {full && <span className="text-18 font-semibold">More</span>}
          </button>
          {moreOpen && (
            <div role="menu" className="absolute left-[45px] top-10 z-50 w-[240px] rounded-md bg-card py-2 text-ink shadow-[0_2px_12px_rgba(0,0,0,0.12)] ring-1 ring-line">
              {!full && items.slice(7).map((it) => <Link key={it.href} role="menuitem" href={it.href} onClick={() => setMoreOpen(false)} className="flex h-11 items-center gap-3 px-4 text-15 font-medium hover:bg-pill [&_svg]:h-[18px] [&_svg]:w-[18px]">{it.icon}{it.label}</Link>)}
              <button role="menuitem" onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setMoreOpen(false); }} className="flex h-11 w-full items-center gap-3 px-4 text-15 font-medium hover:bg-pill"><Moon size={18} />Dark mode<span className="ml-auto text-13 text-muted">{theme === 'dark' ? 'On' : 'Off'}</span></button>
              <button role="menuitem" onClick={() => { openCoins(); setMoreOpen(false); }} className="flex h-11 w-full items-center gap-3 px-4 text-15 font-medium hover:bg-pill"><Coins size={18} />Get Coins</button>
              <Link role="menuitem" href="/seller" className="flex h-11 items-center gap-3 px-4 text-15 font-medium hover:bg-pill"><Wrench size={18} />Creator tools</Link>
              <button role="menuitem" onClick={() => { resetDemo(); setMoreOpen(false); toast('Demo data reset'); }} className="flex h-11 w-full items-center gap-3 px-4 text-15 font-medium hover:bg-pill"><RotateCcw size={18} />Reset demo data</button>
            </div>
          )}
        </div>
      </nav>

      {full ? (
        <div className="mx-5 mt-4 shrink-0">
          <button onClick={() => setLoginOpen((o) => !o)} className="h-10 w-[200px] rounded-btn bg-brand text-16 font-semibold text-white hover:brightness-95">Log in</button>
          {loginOpen && (
            <div className="mt-2 rounded-md bg-pill p-3 text-13 text-ink">
              Demo account <b>@{ME}</b> is already signed in. <Link href="/profile" className="font-semibold text-brand">View profile</Link>
            </div>
          )}
          <hr className="mx-1 mt-6 border-line" />
          <footer className="mt-4 px-1 pb-6">
            {[['Company', '/explore'], ['Program', '/seller'], ['Terms & Policies', '/shop']].map(([t, h]) => (
              <h3 key={t} className="text-15 leading-[22px] font-semibold text-muted mb-[5px]"><Link href={h} className="hover:underline">{t}</Link></h3>
            ))}
            <p className="text-12 font-semibold text-muted">© 2026 Pulse</p>
          </footer>
        </div>
      ) : (
        <Link href="/profile" aria-label="Profile" className="mx-[14px] mt-3 mb-6 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white">
          <UserRound size={22} />
        </Link>
      )}

      {searchOpen && (
        <div className="fixed inset-0 z-[60]" onMouseDown={() => setSearchOpen(false)}>
          <form role="search" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()} className="absolute left-[72px] top-0 h-dvh w-[min(360px,calc(100vw-72px))] border-r border-line bg-canvas p-4 shadow-xl">
            <h2 className="mb-3 text-21 font-bold">Search</h2>
            <div className="flex h-10 items-center gap-2 rounded-pill bg-pill px-3">
              <Search size={18} className="text-muted" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search videos, products, shops..." aria-label="Search" className="min-w-0 flex-1 bg-transparent text-15 outline-none" />
            </div>
            <p className="mt-4 text-13 font-semibold text-muted">Trending</p>
            {['mechanical keyboard', 'desk setup', 'gan charger', 'headphones'].map((s) => (
              <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} onClick={() => setSearchOpen(false)} className="flex h-10 items-center gap-2 text-15 hover:text-brand"><Search size={14} />{s}</Link>
            ))}
          </form>
        </div>
      )}
    </aside>
  );
}
