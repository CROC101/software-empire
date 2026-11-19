import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Title } from '../data/catalog';
import { perRow, useHover, useModal, useWindowWidth } from '../lib/hooks';
import { ChevronLeft, ChevronRight } from './Icons';

const HOVER_DELAY = 350;

export interface RowItem {
  title: Title;
  progress?: number; // 0..1 for Continue Watching
  subtitle?: string;
}

/** Big outlined rank numeral drawn as SVG (1–10). */
function RankNumeral({ n }: { n: number }) {
  return (
    <svg viewBox={n === 10 ? '0 0 160 154' : '0 0 100 154'} className="h-full w-auto" aria-hidden="true">
      <text
        x="50%"
        y="146"
        textAnchor="middle"
        fontSize="170"
        fontWeight="900"
        letterSpacing={n === 10 ? -14 : 0}
        fontFamily="'Noto Sans Thai Variable', Arial Black, sans-serif"
        fill="#141414"
        stroke="#595959"
        strokeWidth="5"
        style={{ paintOrder: 'stroke' }}
      >
        {n}
      </text>
    </svg>
  );
}

function Card({ item, index, per, variant, page }: { item: RowItem; index: number; per: number; variant?: 'top10' | 'continue'; page: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number>();
  const show = useHover((s) => s.show);
  const modal = useModal();
  const t = item.title;
  const pos = index - page * per;
  const edge = pos === 0 ? 'left' : pos === per - 1 ? 'right' : 'mid';

  const enter = () => {
    if (window.matchMedia('(hover: none)').matches) return;
    timer.current = window.setTimeout(() => {
      if (ref.current) show(t, ref.current.getBoundingClientRect(), edge, item.progress);
    }, HOVER_DELAY);
  };
  const leave = () => clearTimeout(timer.current);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="shrink-0 px-[0.2vw]" style={{ width: `${100 / per}%` }}>
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label={t.title}
        onMouseEnter={enter}
        onMouseLeave={leave}
        onClick={() => modal.open(t.id, ref.current?.getBoundingClientRect())}
        onKeyDown={(e) => e.key === 'Enter' && modal.open(t.id, ref.current?.getBoundingClientRect())}
        className="relative block aspect-video cursor-pointer overflow-hidden rounded-sm bg-[#222] outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {variant === 'top10' ? (
          <div className="flex h-full w-full">
            <div className="flex h-full w-1/2 items-center justify-end">
              <RankNumeral n={index + 1} />
            </div>
            <img src={t.poster} alt="" className="h-full w-1/2 object-cover" loading="lazy" />
          </div>
        ) : (
          <img src={t.boxart} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
        {t.isNew && variant !== 'top10' && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-sm bg-accent px-1.5 py-0.5 text-[10px] font-semibold leading-none sm:text-[11px]">มาใหม่</span>
        )}
      </div>
      {variant === 'continue' && item.progress !== undefined && (
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-[3px] flex-1 bg-[#5a5a5a]">
            <div className="h-full bg-accent" style={{ width: `${Math.max(3, item.progress * 100)}%` }} />
          </div>
        </div>
      )}
      {item.subtitle && <p className="mt-1 truncate text-xs text-[#bcbcbc]">{item.subtitle}</p>}
    </div>
  );
}

export function Row({ title, items, variant }: { title: string; items: RowItem[]; variant?: 'top10' | 'continue' }) {
  const w = useWindowWidth();
  const per = perRow(w);
  const pages = Math.max(1, Math.ceil(items.length / per));
  const [page, setPage] = useState(0);
  const [moved, setMoved] = useState(false);
  const [hover, setHover] = useState(false);
  const hide = useHover((s) => s.hide);
  useEffect(() => setPage((p) => Math.min(p, pages - 1)), [pages]);

  const go = (d: 1 | -1) => {
    hide();
    setMoved(true);
    setPage((p) => (p + d + pages) % pages);
  };

  return (
    <section className="relative mb-[3vw] mt-0" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} aria-label={title}>
      <div className="app-gutter flex items-end justify-between">
        <h2 className="mb-[0.5em] text-[12px] font-medium text-[#e5e5e5] sm:text-[1.4vw] sm:leading-[1.25vw] md:text-[1.4vw]" style={{ fontSize: 'max(14px, 1.4vw)' }}>
          {title}
        </h2>
        {pages > 1 && (
          <div className={`mb-2 flex gap-[2px] transition-opacity ${hover ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true">
            {Array.from({ length: pages }, (_, i) => (
              <span key={i} className={`h-[2px] w-3 ${i === page ? 'bg-[#aaa]' : 'bg-[#4d4d4d]'}`} />
            ))}
          </div>
        )}
      </div>
      <div className="relative">
        <div className="overflow-hidden px-[4%]">
          <motion.div className="flex" animate={{ x: `${-page * 100}%` }} transition={{ duration: 0.75, ease: [0.5, 0, 0.1, 1] }}>
            {items.map((it, i) => (
              <Card key={it.title.id + i} item={it} index={i} per={per} variant={variant} page={page} />
            ))}
          </motion.div>
        </div>
        {moved && pages > 1 && (
          <button
            aria-label="ก่อนหน้า"
            onClick={() => go(-1)}
            className="group absolute bottom-0 left-0 top-0 z-10 flex w-[4%] items-center justify-center rounded-r-sm bg-[#14141480] text-white transition-colors hover:bg-[#141414b3]"
          >
            <ChevronLeft className={`transition-transform group-hover:scale-125 ${hover ? 'opacity-100' : 'opacity-0'}`} size={32} />
          </button>
        )}
        {pages > 1 && (
          <button
            aria-label="ถัดไป"
            onClick={() => go(1)}
            className="group absolute bottom-0 right-0 top-0 z-10 flex w-[4%] items-center justify-center rounded-l-sm bg-[#14141480] text-white transition-colors hover:bg-[#141414b3]"
          >
            <ChevronRight className={`transition-transform group-hover:scale-125 ${hover ? 'opacity-100' : 'opacity-0'}`} size={32} />
          </button>
        )}
      </div>
    </section>
  );
}

/** Plain responsive grid (search results, My List, grid view). */
export function TitleGrid({ items }: { items: RowItem[] }) {
  const per = perRow(useWindowWidth());
  return (
    <div className="flex flex-wrap gap-y-10">
      {items.map((it, i) => (
        <Card key={it.title.id} item={it} index={i % per} per={per} page={0} />
      ))}
    </div>
  );
}
