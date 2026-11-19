'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Check, Globe, Heart, Plus, Volume2, X } from 'lucide-react';
import { ARTISTS, ALBUMS } from '@/data/seed-spotify';
import { useLibrary } from '@/context/LibraryContext';
import { usePlayer } from '@/context/SpotifyPlayerContext';
import Cover from '@/components/ui/Cover';

const FOOT = [
  ['Legal', '/account#legal'],
  ['Safety & Privacy Center', '/account#legal'],
  ['Privacy Policy', '/account#legal'],
  ['Cookies', '/account#legal'],
  ['About Ads', '/account#legal'],
  ['Accessibility', '/account#legal'],
] as const;

const LANGS = [['en', 'English'], ['th', 'ไทย'], ['es', 'Español'], ['fr', 'Français'], ['de', 'Deutsch'], ['ja', '日本語'], ['pt', 'Português'], ['id', 'Bahasa Indonesia']] as const;

export default function LeftLibrarySidebar() {
  const lib = useLibrary();
  const p = usePlayer();
  const router = useRouter();
  const path = usePathname();

  const create = () => {
    const id = lib.createPlaylist();
    router.push(id ? `/playlist/${id}` : '/import');
  };

  const rows: { href: string; title: string; sub: string; art: React.ReactNode; playing: boolean }[] = [
    {
      href: '/collection/tracks',
      title: 'Liked Songs',
      sub: `Playlist • ${lib.liked.length} songs`,
      art: (
        <div className="grid h-12 w-12 place-items-center rounded-[4px] bg-[linear-gradient(135deg,#450af5,#c4efd9)]">
          <Heart size={18} fill="white" strokeWidth={0} />
        </div>
      ),
      playing: p.context?.href === '/collection/tracks',
    },
    ...lib.playlists.map((pl) => ({
      href: `/playlist/${pl.id}`,
      title: pl.name,
      sub: `Playlist • ${pl.owner}`,
      art: <Cover cover={pl.cover} className="h-12 w-12 !rounded-[4px]" />,
      playing: p.context?.href === `/playlist/${pl.id}`,
    })),
    ...ARTISTS.filter((a) => lib.isFollowing(a.id)).map((a) => ({
      href: `/artist/${a.id}`,
      title: a.name,
      sub: 'Artist',
      art: <Cover cover={a.cover} round className="h-12 w-12" />,
      playing: p.track?.artistId === a.id && p.isPlaying,
    })),
    ...ALBUMS.slice(0, 2).map((a) => ({
      href: `/album/${a.id}`,
      title: a.title,
      sub: `${a.type} • ${ARTISTS.find((x) => x.id === a.artistId)?.name}`,
      art: <Cover cover={a.cover} className="h-12 w-12 !rounded-[4px]" />,
      playing: p.context?.href === `/album/${a.id}`,
    })),
  ];

  return (
    <nav aria-label="Your Library" className="hidden w-sidebar-md shrink-0 gap-2 md:flex xl:w-sidebar">
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-surface">
      <header className="flex h-[60px] shrink-0 items-center justify-between gap-2 pb-2 pl-4 pr-4 pt-4">
        <h1 className="px-1 text-base font-bold">
          <Link href="/collection/tracks" className="text-white hover:underline">
            Your Library
          </Link>
        </h1>
        <button
          type="button"
          onClick={create}
          aria-label="Create playlist"
          className="flex h-9 items-center gap-2 rounded-full bg-elevated px-4 text-sm font-bold text-white hover:bg-hover max-xl:w-9 max-xl:justify-center max-xl:px-0"
        >
          <Plus size={18} className="text-subdued" />
          <span className="hidden xl:inline">Create</span>
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pt-8">
        <section className="flex flex-col gap-5 rounded-lg bg-elevated px-5 py-4">
          <div>
            <p className="text-base font-bold text-white">Create your first playlist</p>
            <p className="mt-2 text-sm text-white">It&apos;s easy, we&apos;ll help you</p>
          </div>
          <button type="button" onClick={create} className="h-8 w-fit rounded-full bg-white px-4 text-sm font-bold text-black hover:scale-105">
            Create playlist
          </button>
        </section>
        <section className="mt-6 flex flex-col gap-5 rounded-lg bg-elevated px-5 py-4">
          <div>
            <p className="text-base font-bold text-white">Let&apos;s find some podcasts to follow</p>
            <p className="mt-2 text-sm text-white">We&apos;ll keep you updated on new episodes</p>
          </div>
          <Link href="/genre/podcasts-web" className="grid h-8 w-fit place-items-center rounded-full bg-white px-4 text-sm font-bold text-black hover:scale-105">
            Browse podcasts
          </Link>
        </section>

        <ul className="mt-4 pb-2">
          {rows.map((r) => (
            <li key={r.href}>
              <Link href={r.href} className={`flex items-center gap-3 rounded-[6px] p-2 hover:bg-white/5 ${path === r.href ? 'bg-white/10' : ''}`}>
                {r.art}
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-base ${r.playing ? 'text-green' : 'text-white'}`}>{r.title}</span>
                  <span className="block truncate text-sm text-subdued">{r.sub}</span>
                </span>
                {r.playing && <Volume2 size={16} className="text-green" />}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 px-6 pb-3 pt-4">
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-subdued">
          {FOOT.map(([label, href]) => (
            <li key={label}>
              <Link href={href} className="hover:underline">
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/account#legal" className="mt-3 block text-xs text-white hover:underline">
          Cookies
        </Link>
        <LanguagePicker />
      </div>
    </div>
    </nav>
  );
}

/** "English" pill: picks the content language (sets <html lang>, remembered); menus stay English. */
function LanguagePicker() {
  const dlg = useRef<HTMLDialogElement>(null);
  const [lang, setLang] = useState('en');
  useEffect(() => {
    const saved = localStorage.getItem('sonora-lang');
    if (saved) setLang(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const pick = (code: string) => {
    setLang(code);
    localStorage.setItem('sonora-lang', code);
    dlg.current?.close();
  };
  return (
    <>
      <button type="button" onClick={() => dlg.current?.showModal()} className="mt-8 flex h-8 w-fit items-center gap-1 rounded-full border border-[#7c7c7c] px-3 text-sm font-bold text-white hover:scale-105 hover:border-white">
        <Globe size={16} />
        {LANGS.find(([c]) => c === lang)?.[1] ?? 'English'}
      </button>
      <dialog ref={dlg} aria-labelledby="lang-title" className="m-auto w-[min(92vw,720px)] rounded-lg bg-elevated p-6 text-white backdrop:bg-black/70">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="lang-title" className="font-title text-2xl font-bold">Choose a language</h2>
            <p className="mt-1 text-sm text-subdued">This sets the language of the page for your browser and screen readers. Menus stay in English for now.</p>
          </div>
          <button type="button" aria-label="Close" onClick={() => dlg.current?.close()} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-subdued hover:text-white">
            <X size={20} />
          </button>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LANGS.map(([code, name]) => (
            <li key={code}>
              <button type="button" lang={code} onClick={() => pick(code)} className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm hover:bg-white/10 ${lang === code ? 'text-green' : ''}`}>
                {name}
                {lang === code && <Check size={16} />}
              </button>
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
