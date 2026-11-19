'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowDownCircle, Home, Library, Search, X } from 'lucide-react';
import Logo from './Logo';

export default function TopNavBar() {
  const path = usePathname();
  const router = useRouter();
  const [q, setQ] = useState('');
  const onSearch = path.startsWith('/search');

  // keep the box in sync with the address when landing on /search?q=...
  useEffect(() => {
    if (onSearch) setQ(new URLSearchParams(window.location.search).get('q') ?? '');
  }, [onSearch]);

  const go = (v: string) => {
    setQ(v);
    const url = v ? `/search/?q=${encodeURIComponent(v)}` : '/search/';
    if (onSearch) router.replace(url);
    else router.push(url);
  };

  return (
    <div role="banner" className="relative h-header shrink-0 bg-frame">
      <div className="flex h-full items-center gap-2 pl-4 pr-2 md:pl-7">
      <Link href="/" aria-label="Sonora home" className="mr-5 shrink-0">
        <Logo />
      </Link>
      <Link
        href="/"
        aria-label="Home"
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-elevated text-subdued transition hover:scale-105 hover:text-white"
      >
        <Home size={24} fill={path === '/' ? 'white' : 'none'} className={path === '/' ? 'text-white' : ''} />
      </Link>
      <Link href="/search" aria-label="Search" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-elevated text-subdued hover:text-white lg:hidden">
        <Search size={24} />
      </Link>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className="group hidden h-12 w-full max-w-[474px] items-center rounded-full bg-elevated pl-3 pr-2 text-subdued focus-within:ring-2 focus-within:ring-white hover:bg-hover lg:flex"
      >
        <button type="submit" aria-label="Search" className="grid h-9 w-9 place-items-center hover:text-white">
          <Search size={24} />
        </button>
        <input
          type="search"
          value={q}
          onChange={(e) => go(e.target.value)}
          placeholder="What do you want to play?"
          aria-label="What do you want to play?"
          className="h-full min-w-0 flex-1 bg-transparent px-1 text-base text-white placeholder:text-subdued focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button type="button" aria-label="Clear search field" onClick={() => go('')} className="grid h-8 w-8 place-items-center hover:text-white">
            <X size={20} />
          </button>
        )}
        <span className="mx-2 h-6 w-px bg-subdued/60" />
        <Link href="/search" aria-label="Browse" className="grid h-9 w-9 place-items-center hover:text-white">
          <Library size={22} />
        </Link>
      </form>

      <div role="group" aria-label="Account" className="ml-auto hidden items-center md:flex">
        <div className="hidden items-center gap-2 pr-6 xl:flex">
          <Link href="/account" className="px-0 text-base font-bold text-subdued hover:scale-105 hover:text-white">
            Premium
          </Link>
          <Link href="/account#support" className="text-base font-bold text-subdued hover:scale-105 hover:text-white">
            Support
          </Link>
          <Link href="/download" className="text-base font-bold text-subdued hover:scale-105 hover:text-white">
            Download
          </Link>
        </div>
        <span className="mr-6 hidden h-8 w-px bg-white xl:block" />
        <Link href="/download" className="flex h-8 items-center gap-2 text-sm font-bold text-subdued hover:scale-105 hover:text-white">
          <ArrowDownCircle size={16} />
          Install App
        </Link>
        <Link href="/account" className="ml-8 rounded-full bg-green px-2 py-0.5 text-[11px] font-black tracking-[0.1em] text-black" title="Premium is active">
          PREMIUM
        </Link>
        <Link href="/account" className="ml-4 grid h-12 w-[108px] place-items-center rounded-full bg-white text-base font-bold text-black hover:scale-105">
          Account
        </Link>
      </div>
      <Link href="/account" className="ml-auto rounded-full bg-green px-2 py-0.5 text-[11px] font-black tracking-[0.1em] text-black md:hidden">
        PREMIUM
      </Link>
      </div>
    </div>
  );
}
