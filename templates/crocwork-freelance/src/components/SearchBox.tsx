'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { trendingKeywords } from '@/data/categories';
import { useStore } from '@/store/useStore';
import { Icon } from './Icon';

/** Search with a dropdown of trending and recent searches. `size="hero"` is the big pill. */
export function SearchBox({ size = 'nav', initial = '' }: { size?: 'nav' | 'hero'; initial?: string }) {
  const router = useRouter();
  const recent = useStore((s) => s.recentSearches);
  const addRecent = useStore((s) => s.addRecent);
  const clearRecent = useStore((s) => s.clearRecent);
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => setQ(initial), [initial]);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (term: string) => {
    const t = term.trim();
    if (!t) return;
    addRecent(t);
    setOpen(false);
    setQ(t);
    router.push(`/search/?q=${encodeURIComponent(t)}`);
  };

  const filter = q.trim().toLowerCase();
  const trending = trendingKeywords.filter((k) => !filter || k.toLowerCase().includes(filter));
  const hero = size === 'hero';

  return (
    <div ref={wrap} className={`relative w-full ${hero ? '' : 'transition-[max-width] duration-300'} ${!hero && open ? 'max-w-[520px]' : hero ? '' : 'max-w-[360px]'}`}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className={`flex items-center rounded-pill border bg-white transition ${open ? 'border-brand shadow-panel' : 'border-line'} ${hero ? 'h-12 pl-5 pr-1.5' : 'h-10 pl-4 pr-1'}`}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          placeholder={hero ? 'ค้นหาบริการที่คุณต้องการ เช่น ออกแบบโลโก้' : 'ค้นหาบริการ'}
          aria-label="ค้นหาบริการ"
          className={`min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-3 ${hero ? 'text-base' : 'text-sm'}`}
        />
        <button type="submit" aria-label="ค้นหา" className={`grid shrink-0 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-dark ${hero ? 'h-9 w-9' : 'h-8 w-8'}`}>
          <Icon name="search" size={hero ? 20 : 18} />
        </button>
      </form>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-full z-50 mt-2 rounded-lg border border-line-2 bg-white p-4 text-left shadow-panel"
          >
            {recent.length > 0 && (
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-3">ค้นหาล่าสุด</span>
                  <button type="button" onClick={clearRecent} className="text-xs font-medium text-brand hover:underline">
                    ล้างทั้งหมด
                  </button>
                </div>
                <ul>
                  {recent.slice(0, 5).map((r) => (
                    <li key={r}>
                      <button type="button" onClick={() => go(r)} className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-ink hover:bg-surface">
                        <Icon name="history" size={16} className="text-ink-3" /> {r}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <span className="mb-2 block text-xs font-semibold text-ink-3">คำค้นหายอดนิยม</span>
            {trending.length ? (
              <div className="flex flex-wrap gap-2">
                {trending.map((k) => (
                  <button key={k} type="button" onClick={() => go(k)} className="flex items-center gap-1 rounded-pill bg-surface px-3 py-1.5 text-sm text-ink-2 hover:bg-brand-soft hover:text-brand">
                    <Icon name="trend" size={14} /> {k}
                  </button>
                ))}
              </div>
            ) : (
              <button type="button" onClick={() => go(q)} className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-ink hover:bg-surface">
                <Icon name="search" size={16} className="text-ink-3" /> ค้นหา “{q.trim()}”
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
