'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clapperboard,
  Clock,
  Flag,
  Gamepad2,
  History,
  Home,
  Lightbulb,
  ListVideo,
  Menu,
  Music2,
  Newspaper,
  Radio,
  SquarePlay,
  ThumbsUp,
  Trophy,
  UserCircle2,
  Video,
  Zap,
} from 'lucide-react';
import { GradientAvatar, Logo } from '@/components/ui';
import { useYouTube } from '@/context/YouTubeContext';
import { MUSIC_CHANNEL_ID } from '@/data/seed-youtube';
import { cx } from '@/lib/format';

export const normalize = (p: string | null) => (p && p.length > 1 ? p.replace(/\/+$/, '') : p || '/');

function Item({ href, icon, label, active }: { href: string; icon: ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'mx-3 flex h-10 items-center gap-6 rounded-item px-3 text-sm transition-colors hover:bg-soft',
        active ? 'bg-soft font-medium' : 'font-normal',
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

const Divider = () => <hr className="my-3 border-line" />;

export function FullNav() {
  const path = normalize(usePathname());
  const yt = useYouTube();
  const [more, setMore] = useState(false);
  const ic = 24;

  const primary = [
    { href: '/', label: 'Home', icon: <Home size={ic} /> },
    { href: '/shorts', label: 'Shorts', icon: <Zap size={ic} /> },
    { href: '/feed/subscriptions', label: 'Subscriptions', icon: <SquarePlay size={ic} /> },
  ];
  const you = [
    { href: '/feed/history', label: 'History', icon: <History size={ic} /> },
    { href: '/feed/playlists', label: 'Playlists', icon: <ListVideo size={ic} /> },
    { href: '/studio', label: 'Your videos', icon: <Video size={ic} /> },
    { href: '/playlist/WL', label: 'Watch later', icon: <Clock size={ic} /> },
    { href: '/playlist/LL', label: 'Liked videos', icon: <ThumbsUp size={ic} /> },
  ];
  const explore = [
    { href: `/channel/${MUSIC_CHANNEL_ID}`, label: 'Music', icon: <Music2 size={ic} /> },
    { href: '/results?search_query=gaming', label: 'Gaming', icon: <Gamepad2 size={ic} /> },
    { href: '/results?search_query=live', label: 'Live', icon: <Radio size={ic} /> },
  ];
  const exploreMore = [
    { href: '/results?search_query=news', label: 'News', icon: <Newspaper size={ic} /> },
    { href: '/results?search_query=sports', label: 'Sports', icon: <Trophy size={ic} /> },
    { href: '/results?search_query=coding', label: 'Learning', icon: <Lightbulb size={ic} /> },
  ];

  return (
    <nav aria-label="Main" className="pt-3 pb-6">
      {primary.map((i) => (
        <Item key={i.href} {...i} active={path === i.href} />
      ))}
      <Divider />
      <Link
        href="/feed/you"
        aria-current={path === '/feed/you' ? 'page' : undefined}
        className={cx('mx-3 flex h-10 items-center gap-2 rounded-item px-3 text-base font-medium hover:bg-soft', path === '/feed/you' && 'bg-soft')}
      >
        You <ChevronRight size={18} />
      </Link>
      {you.map((i) => (
        <Item key={i.href} {...i} active={path === i.href} />
      ))}
      <Divider />
      <h3 className="px-6 pt-1.5 pb-1 text-base font-medium">Subscriptions</h3>
      {yt.subscribed.length === 0 && <p className="px-6 py-2 text-sm text-muted">No subscriptions yet.</p>}
      {yt.subscribed.map((id) => {
        const ch = yt.getChannel(id);
        if (!ch) return null;
        const active = path === `/channel/${ch.id}`;
        return (
          <Item key={id} href={`/channel/${ch.id}`} active={active} label={ch.name} icon={<GradientAvatar colors={ch.avatar} label={ch.initials} size={24} />} />
        );
      })}
      <Divider />
      <h3 className="px-6 pt-1.5 pb-1 text-base font-medium">Explore</h3>
      {explore.map((i) => (
        <Item key={i.href} {...i} active={path === normalize(i.href)} />
      ))}
      {more && exploreMore.map((i) => <Item key={i.href} {...i} active={false} />)}
      <button type="button" onClick={() => setMore((m) => !m)} className="mx-3 flex h-10 w-[216px] items-center gap-6 rounded-item px-3 text-sm hover:bg-soft">
        {more ? <ChevronUp size={ic} /> : <ChevronDown size={ic} />}
        {more ? 'Show less' : 'Show more'}
      </button>
      <Divider />
      <h3 className="px-6 pt-1.5 pb-1 text-base font-medium">More from ViewTube</h3>
      <Item href="/studio" label="Creator Studio" active={path === '/studio'} icon={<Clapperboard size={ic} className="text-brand" />} />
      <Item href={`/channel/${MUSIC_CHANNEL_ID}`} label="ViewTube Music" active={false} icon={<Music2 size={ic} className="text-brand" />} />
      <Item href="/results?search_query=kids" label="ViewTube Kids" active={false} icon={<SquarePlay size={ic} className="text-brand" />} />
      <Item href="/results?search_query=labs" label="ViewTube Labs" active={false} icon={<Lightbulb size={ic} className="text-brand" />} />
      <Divider />
      <Item href="/feed/history" label="Report history" active={false} icon={<Flag size={ic} />} />
      <Item href="/feed/you" label="Help" active={false} icon={<Lightbulb size={ic} />} />
      <p className="px-6 pt-4 text-xs leading-[18px] font-medium text-faint">
        About · Press · Copyright · Contact us · Creators · Advertise · Developers
      </p>
      <p className="px-6 pt-3 text-xs text-faint">Terms · Privacy · Policy &amp; Safety · How ViewTube works · Test new features</p>
      <p className="px-6 pt-4 text-xs text-faint">© 2026 ViewTube demo</p>
    </nav>
  );
}

export function MiniRail() {
  const path = normalize(usePathname());
  const items = [
    { href: '/', label: 'Home', icon: <Home size={24} /> },
    { href: '/shorts', label: 'Shorts', icon: <Zap size={24} /> },
    { href: '/feed/subscriptions', label: 'Subscriptions', icon: <SquarePlay size={24} /> },
    { href: '/feed/you', label: 'You', icon: <UserCircle2 size={24} /> },
    { href: '/feed/history', label: 'History', icon: <History size={24} /> },
  ];
  return (
    <nav aria-label="Mini guide" className="fixed top-14 bottom-0 left-0 z-30 hidden w-[72px] flex-col gap-0 bg-canvas px-1 pt-1 md:flex">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={path === i.href ? 'page' : undefined}
          className={cx('flex h-[74px] flex-col items-center justify-center gap-1.5 rounded-item text-2xs hover:bg-soft', path === i.href && 'font-medium')}
        >
          {i.icon}
          <span className="max-w-full truncate">{i.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function Drawer() {
  const { drawerOpen, setDrawerOpen } = useYouTube();
  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
          />
          <motion.aside
            className="thin-scroll fixed top-0 bottom-0 left-0 z-[70] w-[240px] overflow-y-auto bg-canvas"
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: 'tween', duration: 0.2 }}
          >
            <div className="sticky top-0 z-10 flex h-14 items-center bg-canvas pl-4">
              <button type="button" aria-label="Close guide" onClick={() => setDrawerOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-soft">
                <Menu size={24} />
              </button>
              <Logo />
            </div>
            <FullNav />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
