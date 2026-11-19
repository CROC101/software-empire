'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

/** Snap-scrolling row; arrows appear only when there is more to scroll that way. */
export function Carousel({ title, href, children, itemClass = 'w-[224px]' }: { title: string; href?: string; children: ReactNode[]; itemClass?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, children.length]);

  const go = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' });

  return (
    <section className="container-fw py-6 md:py-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-lg font-semibold text-ink md:text-xl">{title}</h2>
        {href && (
          <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand hover:underline">
            ดูทั้งหมด <Icon name="chevronRight" size={16} />
          </Link>
        )}
      </div>
      <div className="relative">
        <div ref={ref} onScroll={update} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-3 pt-1 xl:mx-0 xl:scroll-px-0 xl:px-0">
          {children.map((c, i) => (
            <div key={i} className={`flex shrink-0 snap-start ${itemClass}`}>
              {c}
            </div>
          ))}
        </div>
        {edge.left && (
          <button type="button" aria-label="เลื่อนไปทางซ้าย" onClick={() => go(-1)} className="absolute -left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line-2 bg-white text-ink shadow-panel transition hover:text-brand md:grid">
            <Icon name="chevronLeft" />
          </button>
        )}
        {edge.right && (
          <button type="button" aria-label="เลื่อนไปทางขวา" onClick={() => go(1)} className="absolute -right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line-2 bg-white text-ink shadow-panel transition hover:text-brand md:grid">
            <Icon name="chevronRight" />
          </button>
        )}
      </div>
    </section>
  );
}
