'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { categories } from '@/data/categories';
import { useStore } from '@/store/useStore';
import type { CategorySlug } from '@/lib/types';
import { Icon, type IconName } from './Icon';
import { Logo } from './Logo';
import { SearchBox } from './SearchBox';

function NavIcon({ href, icon, label, count = 0 }: { href: string; icon: IconName; label: string; count?: number }) {
  return (
    <Link href={href} aria-label={label} title={label} className="relative grid h-10 w-10 place-items-center rounded-full text-ink-2 transition hover:bg-surface hover:text-brand">
      <Icon name={icon} size={22} />
      {count > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-pill bg-danger px-1 text-2xs font-semibold text-white">{count}</span>}
    </Link>
  );
}

/** Sticky header: logo, search, account links and the category bar with hover flyouts. */
export function Header() {
  const path = usePathname();
  const conversations = useStore((s) => s.conversations);
  const favCount = useStore((s) => s.favorites.length);
  const unread = useMemo(() => conversations.reduce((n, c) => n + c.unread, 0), [conversations]);
  const [hover, setHover] = useState<CategorySlug | null>(null);
  const [mobile, setMobile] = useState(false);
  const active = categories.find((c) => c.slug === hover);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-nav">
      <div className="container-fw flex h-16 items-center gap-3 md:gap-6">
        <button type="button" aria-label="เปิดเมนู" onClick={() => setMobile(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink lg:hidden">
          <Icon name="menu" />
        </button>
        <Logo />
        <div className="hidden min-w-0 flex-1 md:flex">
          <SearchBox />
        </div>
        <nav className="ml-auto flex shrink-0 items-center gap-1">
          <NavIcon href="/favorites/" icon="heart" label="รายการโปรด" count={favCount} />
          <NavIcon href="/messages/" icon="chat" label="ข้อความ" count={unread} />
          <NavIcon href="/orders/" icon="bag" label="คำสั่งซื้อ" />
          <Link href="/seller/dashboard/" className="ml-2 hidden h-10 items-center rounded-sm border border-brand px-4 text-sm font-medium text-brand transition hover:bg-brand-soft lg:flex">
            เริ่มรับงาน
          </Link>
        </nav>
      </div>
      <div className="container-fw pb-3 md:hidden">
        <SearchBox />
      </div>

      <div className="relative hidden border-t border-line-2 lg:block" onMouseLeave={() => setHover(null)}>
        <ul className="container-fw no-scrollbar flex gap-1 overflow-x-auto">
          {categories.map((c) => {
            const on = path?.startsWith(`/categories/${c.slug}`);
            return (
              <li key={c.slug} onMouseEnter={() => setHover(c.slug)}>
                <Link
                  href={`/categories/${c.slug}/`}
                  onFocus={() => setHover(c.slug)}
                  className={`flex h-11 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-sm transition ${on || hover === c.slug ? 'border-brand text-brand' : 'border-transparent text-ink-2 hover:text-brand'}`}
                >
                  <Icon name={c.icon as IconName} size={18} /> {c.name}
                </Link>
              </li>
            );
          })}
        </ul>
        <AnimatePresence>
          {active && (
            <motion.div
              key="flyout"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-x-0 top-full border-t border-line-2 bg-white shadow-panel"
            >
              <div className="container-fw grid grid-cols-[220px_1fr] gap-8 py-6">
                <div>
                  <p className="font-semibold text-ink">{active.name}</p>
                  <p className="mt-1 text-sm text-ink-3">{active.nameEn}</p>
                  <Link href={`/categories/${active.slug}/`} onClick={() => setHover(null)} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                    ดูทั้งหมด <Icon name="chevronRight" size={16} />
                  </Link>
                </div>
                <ul className="grid grid-cols-3 gap-x-6 gap-y-2">
                  {active.subcategories.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/categories/${active.slug}/?sub=${s.slug}`} onClick={() => setHover(null)} className="block rounded-sm px-2 py-1.5 text-sm text-ink-2 hover:bg-surface hover:text-brand">
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {mobile && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="ปิดเมนู" className="absolute inset-0 bg-black/40" onClick={() => setMobile(false)} />
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="absolute inset-y-0 left-0 flex w-[300px] max-w-[85vw] flex-col overflow-y-auto bg-white p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <Logo />
                <button type="button" aria-label="ปิดเมนู" onClick={() => setMobile(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface">
                  <Icon name="close" />
                </button>
              </div>
              <p className="mb-2 text-xs font-semibold text-ink-3">หมวดหมู่</p>
              {categories.map((c) => (
                <Link key={c.slug} href={`/categories/${c.slug}/`} onClick={() => setMobile(false)} className="flex items-center gap-3 rounded-sm px-2 py-2.5 text-sm text-ink hover:bg-surface">
                  <Icon name={c.icon as IconName} size={20} className="text-brand" /> {c.name}
                </Link>
              ))}
              <hr className="my-3 border-line-2" />
              {(
                [
                  ['/favorites/', 'heart', 'รายการโปรด'],
                  ['/messages/', 'chat', 'ข้อความ'],
                  ['/orders/', 'bag', 'คำสั่งซื้อของฉัน'],
                  ['/seller/dashboard/', 'plus', 'เริ่มรับงาน'],
                ] as const
              ).map(([href, icon, label]) => (
                <Link key={href} href={href} onClick={() => setMobile(false)} className="flex items-center gap-3 rounded-sm px-2 py-2.5 text-sm text-ink hover:bg-surface">
                  <Icon name={icon} size={20} className="text-ink-3" /> {label}
                </Link>
              ))}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
