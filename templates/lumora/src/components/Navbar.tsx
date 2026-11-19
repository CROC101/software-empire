import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from './Logo';
import { Bell, Caret, Close, Pencil, Search } from './Icons';
import { avatar } from '../lib/art';
import { useActiveProfile, useStore } from '../store';
import { TITLES } from '../data/catalog';

const LINKS: [string, string][] = [
  ['หน้าหลัก', '/browse'],
  ['ซีรีส์', '/browse/tv'],
  ['ภาพยนตร์', '/browse/movies'],
  ['ใหม่และฮิต', '/latest'],
  ['รายการของฉัน', '/browse/my-list'],
];

function SearchBox() {
  const nav = useNavigate();
  const loc = useLocation();
  const initial = loc.pathname === '/search' ? new URLSearchParams(loc.search).get('q') ?? '' : '';
  const [open, setOpen] = useState(!!initial);
  const [q, setQ] = useState(initial);
  const input = useRef<HTMLInputElement>(null);
  const from = useRef('/browse');

  useEffect(() => {
    if (loc.pathname !== '/search') from.current = loc.pathname;
  }, [loc.pathname]);

  // debounce typing into the URL; empty query returns to the previous page
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`, { replace: loc.pathname === '/search' });
      else if (loc.pathname === '/search') nav(from.current, { replace: true });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="relative flex items-center">
      <motion.div
        className="flex items-center overflow-hidden border"
        animate={{ width: open ? 'min(270px, 46vw)' : 30, borderColor: open ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,0)', backgroundColor: open ? 'rgba(0,0,0,.75)' : 'rgba(0,0,0,0)' }}
        transition={{ duration: 0.3, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <button
          aria-label="ค้นหา"
          className="flex h-[34px] w-[30px] shrink-0 items-center justify-center"
          onClick={() => {
            setOpen(true);
            setTimeout(() => input.current?.focus(), 50);
          }}
        >
          <Search size={20} />
        </button>
        <input
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onBlur={() => !q && setOpen(false)}
          placeholder="ชื่อเรื่อง นักแสดง ประเภท"
          aria-label="ค้นหาชื่อเรื่อง นักแสดง ประเภท"
          className="h-[34px] min-w-0 flex-1 bg-transparent pr-2 text-sm text-white outline-none placeholder:text-[#999]"
        />
        {open && q && (
          <button aria-label="ล้าง" onClick={() => setQ('')} className="pr-2">
            <Close size={16} />
          </button>
        )}
      </motion.div>
    </div>
  );
}

function Menu({ trigger, children, align = 'right' }: { trigger: ReactNode; children: ReactNode; align?: 'right' | 'center' }) {
  const [open, setOpen] = useState(false);
  const t = useRef<number>();
  return (
    <div
      className="relative"
      onMouseEnter={() => {
        clearTimeout(t.current);
        setOpen(true);
      }}
      onMouseLeave={() => {
        t.current = window.setTimeout(() => setOpen(false), 200);
      }}
    >
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full mt-4 border border-[#ffffff26] bg-black/90 text-sm ${align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}
            onClick={() => setOpen(false)}
          >
            <div className={`absolute -top-[9px] h-0 w-0 border-x-[8px] border-b-[8px] border-x-transparent border-b-[#e5e5e5] ${align === 'right' ? 'right-8' : 'left-1/2 -translate-x-1/2'}`} />
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const [solid, setSolid] = useState(false);
  const profile = useActiveProfile();
  const profiles = useStore((s) => s.profiles);
  const select = useStore((s) => s.selectProfile);
  const signOut = useStore((s) => s.signOut);
  const nav = useNavigate();

  useEffect(() => {
    const f = () => setSolid(window.scrollY > 20);
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  const kids = profile?.kids;
  return (
    <header
      className="fixed inset-x-0 top-0 z-30 transition-colors duration-[400ms]"
      style={{
        backgroundColor: solid ? 'rgb(20,20,20)' : 'rgba(20,20,20,0)',
        backgroundImage: solid ? 'none' : 'linear-gradient(180deg, rgba(0,0,0,.7) 10%, transparent)',
      }}
    >
      <nav className="app-gutter flex h-[41px] items-center text-sm sm:h-[68px]" aria-label="หลัก">
        <Logo height={25} to="/browse" className="mr-[5px] shrink-0 sm:mr-[25px]" />
        {kids && <span className="mr-4 rounded-sm bg-[#ffd400] px-1.5 text-xs font-bold text-black">KIDS</span>}
        {/* desktop links */}
        <ul className="hidden items-center lg:flex">
          {LINKS.map(([l, to]) => (
            <li key={to} className="ml-5">
              <NavLink to={to} end className={({ isActive }) => `transition-colors ${isActive ? 'font-medium text-white' : 'text-[#e5e5e5] hover:text-[#b3b3b3]'}`}>
                {l}
              </NavLink>
            </li>
          ))}
        </ul>
        {/* compact "Browse" menu */}
        <div className="lg:hidden">
          <Menu
            align="center"
            trigger={
              <button className="flex items-center gap-1 text-xs font-medium sm:text-sm">
                เรียกดู <Caret />
              </button>
            }
          >
            <ul className="w-[260px] border-t-2 border-[#e5e5e5] py-2">
              {LINKS.map(([l, to]) => (
                <li key={to}>
                  <NavLink to={to} end className={({ isActive }) => `block py-3 text-center hover:bg-[#ffffff14] ${isActive ? 'font-semibold text-white' : 'text-[#b3b3b3]'}`}>
                    {l}
                  </NavLink>
                </li>
              ))}
            </ul>
          </Menu>
        </div>
        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          <SearchBox />
          {!kids && (
            <Link to="/browse?kids=1" onClick={() => select(profiles.find((p) => p.kids)?.id ?? null)} className="hidden text-[#e5e5e5] hover:text-white md:block">
              เด็ก
            </Link>
          )}
          <Menu
            trigger={
              <button aria-label="การแจ้งเตือน" className="relative hidden sm:block">
                <Bell size={22} />
                <span className="absolute -right-1.5 -top-1 rounded-full bg-accent px-1 text-[10px] leading-4">3</span>
              </button>
            }
          >
            <ul className="w-[340px] border-t-2 border-[#e5e5e5]">
              {TITLES.filter((t) => t.isNew)
                .slice(0, 3)
                .map((t) => (
                  <li key={t.id} className="flex gap-3 border-b border-[#ffffff1a] p-3">
                    <img src={t.boxart} alt="" className="h-[63px] w-[112px] rounded-sm object-cover" />
                    <div>
                      <p className="text-[#e5e5e5]">มาใหม่</p>
                      <p className="font-medium text-white">{t.title}</p>
                      <p className="text-xs text-[#999]">{t.kind === 'series' ? 'ซีรีส์ใหม่' : 'ภาพยนตร์ใหม่'}</p>
                    </div>
                  </li>
                ))}
            </ul>
          </Menu>
          <Menu
            trigger={
              <button aria-label="เมนูบัญชี" className="group flex items-center gap-2">
                <img src={avatar(profile?.avatar ?? 0)} alt="" className="h-8 w-8 rounded-sm" />
                <Caret className="hidden transition-transform group-hover:rotate-180 sm:block" />
              </button>
            }
          >
            <div className="w-[220px] border-t-2 border-[#e5e5e5] py-2">
              {profiles
                .filter((p) => p.id !== profile?.id)
                .map((p) => (
                  <button key={p.id} onClick={() => (select(p.id), nav('/browse'))} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:underline">
                    <img src={avatar(p.avatar)} alt="" className="h-8 w-8 rounded-sm" />
                    {p.name}
                  </button>
                ))}
              <Link to="/profiles?manage=1" className="flex items-center gap-3 px-3 py-2 hover:underline">
                <Pencil size={20} className="mx-1.5" /> จัดการโปรไฟล์
              </Link>
              <Link to="/youraccount" className="flex items-center gap-3 px-3 py-2 hover:underline">
                <span className="mx-1.5 inline-block h-5 w-5 rounded-full border-2 border-current" /> บัญชี
              </Link>
              <div className="mt-2 border-t border-[#ffffff40] pt-3 text-center">
                <button onClick={() => (signOut(), nav('/th/'))} className="pb-1 hover:underline">
                  ออกจากระบบ
                </button>
              </div>
            </div>
          </Menu>
        </div>
      </nav>
    </header>
  );
}
