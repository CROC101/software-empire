'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Clapperboard,
  Clock,
  History,
  ListVideo,
  Menu,
  Mic,
  Plus,
  Search,
  ThumbsUp,
  UserSquare2,
  X,
} from 'lucide-react';
import { GradientAvatar, IconButton, Logo, Modal, useClickOutside } from '@/components/ui';
import { MY_CHANNEL_ID, useYouTube } from '@/context/YouTubeContext';
import { timeAgo } from '@/lib/format';
import Thumbnail from '@/components/video/Thumbnail';
import { normalize } from './Sidebar';

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechCtor = new () => SpeechRecognitionLike;

function VoiceModal({ open, onClose, onResult }: { open: boolean; onClose: () => void; onResult: (q: string) => void }) {
  const [status, setStatus] = useState('Listening…');
  const [text, setText] = useState('');
  useEffect(() => {
    if (!open) return;
    setText('');
    const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setStatus('Voice search is not supported in this browser. Try typing instead.');
      return;
    }
    setStatus('Listening…');
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.interimResults = true;
    let finalText = '';
    rec.onresult = (e) => {
      finalText = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join('');
      setText(finalText);
    };
    rec.onerror = () => setStatus('Didn’t hear that. Try again.');
    rec.onend = () => {
      if (finalText) onResult(finalText);
    };
    try {
      rec.start();
    } catch {
      setStatus('Microphone unavailable.');
    }
    return () => rec.stop();
  }, [open, onResult]);

  return (
    <Modal open={open} onClose={onClose} title="Search with your voice" width="max-w-xl">
      <div className="flex min-h-[220px] flex-col justify-between gap-8">
        <p className="text-2xl">{text || status}</p>
        <div className="flex justify-center">
          <span className="animate-pulse-ring grid h-[72px] w-[72px] place-items-center rounded-full bg-brand text-white">
            <Mic size={32} />
          </span>
        </div>
      </div>
    </Modal>
  );
}

function Popover({ open, children, className = '' }: { open: boolean; children: React.ReactNode; className?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.14 }}
          className={`absolute top-12 right-0 z-[80] overflow-hidden rounded-card bg-elevated shadow-card ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function TopHeader() {
  const yt = useYouTube();
  const router = useRouter();
  const path = normalize(usePathname());
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const [sel, setSel] = useState(-1);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [voice, setVoice] = useState(false);
  const [bell, setBell] = useState(false);
  const [menu, setMenu] = useState(false);
  const searchBox = useRef<HTMLFormElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(searchBox, useCallback(() => setFocused(false), []), focused);
  useClickOutside(bellRef, useCallback(() => setBell(false), []), bell);
  useClickOutside(menuRef, useCallback(() => setMenu(false), []), menu);

  useEffect(() => {
    if (path !== '/results') return;
    setQ(new URLSearchParams(window.location.search).get('search_query') ?? '');
  }, [path]);

  const suggestions = useMemo(() => {
    const t = q.trim().toLowerCase();
    const past = yt.searchHistory.filter((s) => s.toLowerCase().includes(t)).slice(0, 4).map((s) => ({ text: s, past: true }));
    if (!t) return past;
    const pool = new Set<string>();
    for (const v of yt.videos) {
      if (v.title.toLowerCase().includes(t)) pool.add(v.title.toLowerCase());
      for (const h of v.hashtags) if (h.includes(t)) pool.add(h);
      if (v.category.toLowerCase().includes(t)) pool.add(v.category.toLowerCase());
    }
    for (const c of yt.channels) if (c.name.toLowerCase().includes(t)) pool.add(c.name.toLowerCase());
    return [...past, ...[...pool].filter((x) => !past.some((p) => p.text.toLowerCase() === x)).slice(0, 10 - past.length).map((text) => ({ text, past: false }))];
  }, [q, yt.searchHistory, yt.videos, yt.channels]);

  const submit = (query: string) => {
    const t = query.trim();
    if (!t) return;
    setQ(t);
    yt.addSearch(t);
    setFocused(false);
    setMobileSearch(false);
    router.push(`/results?search_query=${encodeURIComponent(t)}`);
  };

  const onVoice = useCallback(
    (text: string) => {
      setVoice(false);
      submit(text);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const hamburger = () => {
    if (window.innerWidth >= 1312 && path !== '/watch' && path !== '/shorts') yt.setSidebarFull(!yt.sidebarFull);
    else yt.setDrawerOpen(!yt.drawerOpen);
  };

  const notifications = useMemo(
    () =>
      yt.videos
        .filter((v) => yt.subscribed.includes(v.channelId) && v.visibility === 'Public')
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
        .slice(0, 6),
    [yt.videos, yt.subscribed],
  );

  const me = yt.getChannel(MY_CHANNEL_ID);

  const searchForm = (
    <form
      ref={searchBox}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        submit(sel >= 0 && suggestions[sel] ? suggestions[sel].text : q);
      }}
      className="relative flex h-10 min-w-0 flex-1"
    >
      <div className="relative flex min-w-0 flex-1 items-center rounded-l-[40px] border border-[#303030] bg-[#121212] pl-4 focus-within:ml-0 focus-within:border-link">
        <AnimatePresence initial={false}>
          {focused && (
            <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: 28, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="shrink-0 overflow-hidden">
              <Search size={18} />
            </motion.span>
          )}
        </AnimatePresence>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(-1);
            setFocused(true);
          }}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSel((s) => Math.min(suggestions.length - 1, s + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSel((s) => Math.max(-1, s - 1));
            } else if (e.key === 'Escape') setFocused(false);
          }}
          placeholder="Search"
          aria-label="Search"
          aria-autocomplete="list"
          className="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-[#888]"
        />
        {q && (
          <button type="button" aria-label="Clear search query" onClick={() => setQ('')} className="mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-soft">
            <X size={22} />
          </button>
        )}
      </div>
      <button type="submit" aria-label="Search" className="grid h-10 w-16 shrink-0 place-items-center rounded-r-[40px] border border-l-0 border-[#303030] bg-[#222] hover:bg-hover">
        <Search size={22} />
      </button>
      <AnimatePresence>
        {focused && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            role="listbox"
            className="absolute top-11 right-16 left-0 z-[80] rounded-card bg-elevated py-4 shadow-card"
          >
            {suggestions.map((s, i) => (
              <li key={s.text} role="option" aria-selected={i === sel} className={`flex items-center ${i === sel ? 'bg-soft' : 'hover:bg-soft'}`}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => submit(s.text)} className="flex h-8 flex-1 items-center gap-4 px-4 text-left text-base font-medium">
                  {s.past ? <Clock size={18} className="shrink-0 text-muted" /> : <Search size={18} className="shrink-0 text-muted" />}
                  <span className="truncate">{s.text}</span>
                </button>
                {s.past && (
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => yt.removeSearch(s.text)} className="px-4 text-sm text-link hover:underline">
                    Remove
                  </button>
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </form>
  );

  if (mobileSearch) {
    return (
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-2 bg-canvas px-2">
        <IconButton label="Back" onClick={() => setMobileSearch(false)}>
          <ArrowLeft size={24} />
        </IconButton>
        {searchForm}
        <IconButton label="Search with your voice" onClick={() => setVoice(true)} className="bg-soft">
          <Mic size={22} />
        </IconButton>
        <VoiceModal open={voice} onClose={() => setVoice(false)} onResult={onVoice} />
      </header>
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between bg-canvas pr-4 pl-4">
      <div className="flex shrink-0 items-center">
        <IconButton label="Guide" onClick={hamburger}>
          <Menu size={24} />
        </IconButton>
        <Logo />
      </div>

      <div className="mx-4 hidden max-w-[732px] flex-1 items-center justify-center sm:flex lg:ml-10">
        <div className="flex w-full max-w-[600px]">{searchForm}</div>
        <IconButton label="Search with your voice" onClick={() => setVoice(true)} className="ml-4 bg-soft hover:bg-hover">
          <Mic size={22} />
        </IconButton>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <IconButton label="Search" onClick={() => setMobileSearch(true)} className="sm:hidden">
          <Search size={24} />
        </IconButton>
        <Link href="/studio" className="hidden h-9 items-center gap-1.5 rounded-pill bg-raised pr-4 pl-2.5 text-sm font-medium hover:bg-hover md:flex">
          <Plus size={24} /> Create
        </Link>
        <Link href="/studio" aria-label="Create" className="grid h-10 w-10 place-items-center rounded-full hover:bg-soft md:hidden">
          <Plus size={24} />
        </Link>

        <div ref={bellRef} className="relative">
          <IconButton label="Notifications" onClick={() => setBell((b) => !b)} active={bell}>
            <span className="relative">
              <Bell size={24} />
              {notifications.length > 0 && (
                <span className="absolute -top-1.5 -right-2 rounded-full bg-brand px-1 text-[11px] leading-4 font-medium text-white">{notifications.length}</span>
              )}
            </span>
          </IconButton>
          <Popover open={bell} className="w-[min(480px,calc(100vw-24px))]">
            <div className="border-b border-line px-4 py-3 text-base">Notifications</div>
            <ul className="thin-scroll max-h-[60vh] overflow-y-auto py-2">
              {notifications.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">Subscribe to channels to get notified about new videos.</li>}
              {notifications.map((v) => {
                const ch = yt.getChannel(v.channelId);
                return (
                  <li key={v.id}>
                    <Link href={`/watch?v=${v.id}`} onClick={() => setBell(false)} className="flex gap-3 px-4 py-3 hover:bg-soft">
                      {ch && <GradientAvatar colors={ch.avatar} label={ch.initials} size={48} />}
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="line-clamp-3">
                          {ch?.name} uploaded: {v.title}
                        </p>
                        <p className="mt-1 text-xs text-muted">{timeAgo(v.publishedAt)}</p>
                      </div>
                      <div className="w-[86px] shrink-0">
                        <Thumbnail video={v} rounded="rounded" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Popover>
        </div>

        <div ref={menuRef} className="relative ml-1 sm:ml-2">
          <button type="button" aria-label="Account menu" onClick={() => setMenu((m) => !m)} className="grid h-10 w-10 place-items-center rounded-full">
            <GradientAvatar colors={['#3ea6ff', '#7f5cff']} label="Y" size={32} />
          </button>
          <Popover open={menu} className="w-[300px] max-w-[calc(100vw-24px)]">
            <div className="flex gap-4 border-b border-line p-4">
              <GradientAvatar colors={['#3ea6ff', '#7f5cff']} label="Y" size={40} />
              <div className="text-base">
                <p>You</p>
                <p>@{me?.handle}</p>
                <Link href={`/channel/${MY_CHANNEL_ID}`} onClick={() => setMenu(false)} className="mt-2 block text-sm text-link">
                  View your channel
                </Link>
              </div>
            </div>
            <ul className="py-2" onClick={() => setMenu(false)}>
              {[
                { href: `/channel/${MY_CHANNEL_ID}`, label: 'Your channel', icon: <UserSquare2 size={22} /> },
                { href: '/studio', label: 'Creator Studio', icon: <Clapperboard size={22} /> },
                { href: '/feed/history', label: 'History', icon: <History size={22} /> },
                { href: '/feed/playlists', label: 'Playlists', icon: <ListVideo size={22} /> },
                { href: '/playlist/WL', label: 'Watch later', icon: <Clock size={22} /> },
                { href: '/playlist/LL', label: 'Liked videos', icon: <ThumbsUp size={22} /> },
              ].map((i) => (
                <li key={i.label}>
                  <Link href={i.href} className="flex h-10 items-center gap-4 px-4 text-sm hover:bg-soft">
                    {i.icon}
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Popover>
        </div>
      </div>
      <VoiceModal open={voice} onClose={() => setVoice(false)} onResult={onVoice} />
    </header>
  );
}
