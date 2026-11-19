'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Crown, DownloadCloud, Heart, Home, Library, Pause, Play, Search } from 'lucide-react';
import { usePlayer } from '@/context/SpotifyPlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import Cover from '@/components/ui/Cover';
import { useCoverColor } from '@/components/ui/Hero';

const TABS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/collection/tracks', label: 'Your Library', icon: Library },
  { href: '/import', label: 'Import', icon: DownloadCloud },
  { href: '/account', label: 'Premium', icon: Crown },
] as const;

export default function MobileBottomNav({ onExpand }: { onExpand: () => void }) {
  const path = usePathname();
  const p = usePlayer();
  const lib = useLibrary();
  const t = p.track;
  const color = useCoverColor(t?.cover);
  const pct = (p.currentTime / (p.duration || t?.duration || 1)) * 100;

  return (
    <div className="shrink-0 md:hidden">
      {t && (
        <div className="px-2 pb-1 pt-2">
          <div
            role="button"
            tabIndex={0}
            aria-label="Open now playing"
            onClick={onExpand}
            onKeyDown={(e) => e.key === 'Enter' && onExpand()}
            className="relative flex h-14 items-center gap-2 overflow-hidden rounded-lg px-2 transition-colors duration-700"
            style={{ background: `color-mix(in srgb, ${color} 55%, #121212)` }}
          >
            <Cover cover={t.cover} className="h-10 w-10 !rounded-[4px]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{t.title}</p>
              <p className="truncate text-xs text-white/70">{t.artistName}</p>
            </div>
            <button
              type="button"
              aria-label="Like"
              onClick={(e) => {
                e.stopPropagation();
                lib.toggleLike(t);
              }}
              className={`grid h-10 w-10 place-items-center ${lib.isLiked(t.id) ? 'text-green' : 'text-white'}`}
            >
              <Heart size={22} fill={lib.isLiked(t.id) ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              aria-label={p.isPlaying ? 'Pause' : 'Play'}
              onClick={(e) => {
                e.stopPropagation();
                p.togglePlay();
              }}
              className="grid h-10 w-10 place-items-center"
            >
              {p.isPlaying ? <Pause size={24} fill="white" strokeWidth={0} /> : <Play size={24} fill="white" strokeWidth={0} />}
            </button>
            <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-white/20">
              <span className="block h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
            </span>
          </div>
        </div>
      )}
      <nav aria-label="Main" className="grid h-16 grid-cols-5 bg-[linear-gradient(180deg,rgba(0,0,0,.7),#000)] pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ href, label, icon: Icon }) => {
          const on = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex flex-col items-center justify-center gap-1 text-[10px] ${on ? 'text-white' : 'text-subdued'}`}>
              <Icon size={22} strokeWidth={on ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
