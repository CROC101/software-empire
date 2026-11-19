"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Clock, Compass, Menu, Search, UploadCloud, User, X } from "lucide-react";
import { HubBrandLogo } from "@/components/brand/HubBrandLogo";
import { useHub } from "@/context/MediaHubContext";
import { channels, categories } from "@/data/seed-media";
import { STRIP_LINKS } from "./nav";

export const SPRING = { type: "spring", stiffness: 450, damping: 32 } as const;
const SCOPES = ["Videos", "Channels", "Playlists", "GIFs"] as const;
type Scope = (typeof SCOPES)[number];

function useOutside(ref: React.RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    const on = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", on);
    return () => document.removeEventListener("mousedown", on);
  }, [ref, close]);
}

function SearchBox({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const { videos } = useHub();
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<Scope>("Videos");
  const [scopeOpen, setScopeOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const box = useRef<HTMLFormElement>(null);
  useOutside(box, () => {
    setScopeOpen(false);
    setFocus(false);
  });

  const suggestions = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const pool =
      scope === "Channels"
        ? channels.map((c) => c.name)
        : [...videos.map((v) => v.title), ...categories.map((c) => c.name), ...videos.flatMap((v) => v.tags)];
    return [...new Set(pool)].filter((s) => s.toLowerCase().includes(term)).slice(0, 7);
  }, [q, scope, videos]);

  const go = (term: string) => {
    const tab = scope === "GIFs" ? "Videos" : scope;
    router.push(`/search?q=${encodeURIComponent(term)}&tab=${tab}`);
    setFocus(false);
    onDone?.();
  };

  return (
    <form
      ref={box}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) go(q.trim());
      }}
      className="relative flex h-[41px] w-full items-center"
    >
      <Search className="pointer-events-none absolute left-[14px] h-[18px] w-[18px] text-ink" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocus(true)}
        placeholder="Search StreamHub"
        aria-label="Search"
        className="h-[37px] w-full rounded-pill bg-pill pl-[44px] pr-[104px] text-md text-white placeholder:text-ink outline-none focus:ring-1 focus:ring-brand/60"
      />
      <button
        type="button"
        onClick={() => setScopeOpen((o) => !o)}
        className="absolute right-[4px] flex h-[29px] items-center gap-1 rounded-pill bg-chip px-3 text-xs font-bold text-ink hover:bg-pill-hover"
        aria-haspopup="listbox"
        aria-expanded={scopeOpen}
      >
        {scope} <ChevronDown className="h-3 w-3" />
      </button>
      <AnimatePresence>
        {scopeOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={SPRING}
            className="absolute right-0 top-[44px] z-50 w-[140px] overflow-hidden rounded-[3px] border border-hairline bg-surface-2"
            role="listbox"
          >
            {SCOPES.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => {
                    setScope(s);
                    setScopeOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-pill-hover ${s === scope ? "text-brand" : "text-white"}`}
                >
                  {s}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {focus && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING}
            className="absolute left-0 right-0 top-[44px] z-40 overflow-hidden rounded-[3px] border border-hairline bg-surface-2 py-1"
          >
            {suggestions.map((s) => (
              <li key={s}>
                <Link
                  href={`/search?q=${encodeURIComponent(s)}&tab=${scope === "GIFs" ? "Videos" : scope}`}
                  onClick={() => {
                    setFocus(false);
                    onDone?.();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-md text-ink hover:bg-pill-hover hover:text-white"
                >
                  <Search className="h-3.5 w-3.5 text-muted" /> {s}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </form>
  );
}

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { subscriptions, allPlaylists } = useHub();
  useOutside(ref, () => setOpen(false));
  const items = [
    { href: "/playlists/favorites", label: "My Favorites" },
    { href: "/playlists/watch-later", label: "Watch Later" },
    { href: "/playlists/history", label: "Watch History" },
    { href: "/upload", label: "Upload Studio" },
    { href: "/channels", label: `Subscriptions (${subscriptions.length})` },
    ...allPlaylists.filter((p) => !p.system).map((p) => ({ href: `/playlists/${p.id}`, label: p.name })),
  ];
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Profile menu"
        aria-expanded={open}
        className="flex h-[45px] w-[45px] items-center justify-center rounded-full bg-surface text-ink hover:text-white"
      >
        <User className="h-6 w-6" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={SPRING}
            className="absolute right-0 top-[52px] z-50 w-[220px] overflow-hidden rounded-[3px] border border-hairline bg-surface-2 py-2"
          >
            <p className="px-4 pb-2 text-xs text-muted">
              Signed in as <span className="font-bold text-white">guest</span>
              <span className="ml-2 rounded-[2px] bg-brand px-1 text-2xs font-bold text-black">PREMIUM</span>
            </p>
            {items.map((i) => (
              <Link key={i.href + i.label} href={i.href} onClick={() => setOpen(false)} className="block px-4 py-2 text-md text-ink hover:bg-pill-hover hover:text-white">
                {i.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TopHeader({ onMenu }: { onMenu: () => void }) {
  const [mobileSearch, setMobileSearch] = useState(false);
  const { watchLater } = useHub();
  return (
    <>
      {/* 22px utility strip */}
      <div className="h-[22px] overflow-hidden bg-obsidian">
        <ul className="no-scrollbar mx-auto flex h-full max-w-site items-center justify-start overflow-x-auto md:justify-center">
          {STRIP_LINKS.map((l) => (
            <li key={l.label} className="shrink-0">
              <Link href={l.href} className="block px-[20px] text-2xs uppercase leading-[22px] text-muted hover:text-white">
                {l.label}
              </Link>
            </li>
          ))}
          <li className="shrink-0 px-[20px] text-2xs leading-[22px] text-muted">EN</li>
        </ul>
      </div>
      {/* 61px top bar */}
      <div className="bg-bar">
        <div className="mx-auto flex h-[61px] max-w-site items-center gap-[10px] px-[10px] xl:px-0">
          <button onClick={onMenu} aria-label="Open menu" className="flex h-[60px] w-[27px] shrink-0 items-center justify-center text-brand">
            <Menu className="h-[26px] w-[26px]" strokeWidth={2.5} />
          </button>
          <Link href="/categories" aria-label="Browse categories" className="hidden h-[36px] shrink-0 items-center gap-1 px-[10px] text-white hover:text-brand md:flex">
            <Compass className="h-5 w-5" /> <ChevronDown className="h-3 w-3" />
          </Link>
          <div className="w-[150px] shrink-0 lg:ml-[10px]">
            <HubBrandLogo size={27} badge />
          </div>
          <div className="ml-[25px] hidden min-w-0 max-w-[596px] flex-1 md:block">
            <SearchBox />
          </div>
          <div className="ml-auto flex items-center gap-[10px] md:ml-[20px]">
            <Link
              href="/upload"
              title="Premium unlocked: 4K, downloads, no ads"
              className="hidden h-[38px] items-center rounded-pill bg-brand-hover px-[14px] text-xs font-bold text-black hover:bg-brand lg:flex"
            >
              PREMIUM UNLOCKED
            </Link>
            <button onClick={() => setMobileSearch((s) => !s)} aria-label="Search" className="flex h-[36px] w-[36px] items-center justify-center text-white md:hidden">
              {mobileSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>
            <Link href="/upload" aria-label="Upload" title="Upload" className="hidden h-[36px] w-[40px] items-center justify-center text-ink hover:text-brand sm:flex">
              <UploadCloud className="h-[26px] w-[26px]" />
            </Link>
            <Link href="/playlists/watch-later" aria-label="Watch Later" title="Watch Later" className="relative hidden h-[36px] w-[36px] items-center justify-center text-ink hover:text-brand sm:flex">
              <Clock className="h-[22px] w-[22px]" />
              {watchLater.length > 0 && (
                <span className="absolute right-0 top-0 rounded-full bg-brand px-1 text-[9px] font-bold text-black">{watchLater.length}</span>
              )}
            </Link>
          </div>
          <div className="shrink-0 md:ml-auto">
            <ProfileMenu />
          </div>
        </div>
        {mobileSearch && (
          <div className="px-[10px] pb-[10px] md:hidden">
            <SearchBox onDone={() => setMobileSearch(false)} />
          </div>
        )}
      </div>
    </>
  );
}
