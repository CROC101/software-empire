'use client';

import { useRef, useState } from 'react';
import { ChevronRight, Flame, Lock } from 'lucide-react';
import { Art } from '@/components/common/Visuals';
import { Modal } from '@/components/common/Overlay';
import { dramas, shortDramaFilters, videos } from '@/data/seed-tiktok';
import type { Drama } from '@/types/tiktok';

function FilterRow({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="relative flex items-center">
      <div ref={ref} className="flex min-w-0 flex-1 gap-1 overflow-x-auto pr-8 no-scrollbar">
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)} aria-pressed={value === o}
            className={`h-8 shrink-0 rounded-pill px-3 text-15 font-medium ${value === o ? 'bg-pill font-semibold text-ink' : 'text-muted-2 hover:text-ink'}`}>{o}</button>
        ))}
      </div>
      <button aria-label="Scroll filters" onClick={() => ref.current?.scrollBy({ left: 240, behavior: 'smooth' })} className="absolute right-0 flex h-8 w-6 items-center justify-center bg-gradient-to-l from-canvas from-60% to-transparent text-muted"><ChevronRight size={16} /></button>
    </div>
  );
}

export default function ShortDramaPage() {
  const [tab, setTab] = useState('All');
  const [filters, setFilters] = useState(shortDramaFilters.map((r) => r[0]));
  const [open, setOpen] = useState<Drama | null>(null);
  const [ep, setEp] = useState(1);
  const [more, setMore] = useState(false);

  const genreFilter = filters.slice(0, 3).find((f) => !f.startsWith('All'));
  let list = genreFilter ? dramas.filter((d) => d.genre === genreFilter) : dramas;
  if (filters[3] !== 'All releases') list = list.filter((d) => d.isNew || Number(d.id.slice(1)) % 3 === 0);
  if (tab === 'Rankings') list = [...list].sort((a, b) => parseFloat(b.views) - parseFloat(a.views));
  if (tab === 'Latest') list = [...list].reverse();

  return (
    <div className="px-3 pb-16 pt-[10px] md:px-[13px] md:pt-[22px] xl:px-8">
      <h1 className="text-24 leading-9 font-bold md:pr-[400px]">Short dramas</h1>
      <div className="mt-[18px] flex border-b border-line" role="tablist">
        {['All', 'Rankings', 'Latest'].map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`relative h-11 w-[96px] text-16 font-semibold ${tab === t ? 'text-ink' : 'text-muted'}`}>
            {t}{tab === t && <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-ink" />}
          </button>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {shortDramaFilters.map((row, i) => (
          <FilterRow key={i} options={row} value={filters[i]} onChange={(v) => setFilters((f) => f.map((x, j) => (j === i ? v : x)))} />
        ))}
      </div>
      <div className="mt-[22px] grid grid-cols-[192px] gap-x-4 gap-y-5 sm:grid-cols-3 sm:gap-y-6 lg:grid-cols-4 xl:grid-cols-6">
        {list.map((d, i) => (
          <button key={d.id} onClick={() => { setOpen(d); setEp(1); }} className={`group min-w-0 self-start text-left ${more ? '' : [i >= 30 && 'max-sm:hidden', i >= 42 && 'md:hidden', i >= 24 && 'xl:hidden'].filter(Boolean).join(' ')}`}>
            <div className="relative aspect-[176/235] overflow-hidden rounded-md">
              <Art hue={d.hue} seed={i + 2} className="absolute inset-0 h-full w-full transition-transform group-hover:scale-105" />
              <span className="absolute inset-x-3 bottom-9 font-display text-[19px] leading-6 font-extrabold text-white italic drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)]">{d.title}</span>
              {d.isNew && <span className="absolute left-0 top-0 rounded-br-md bg-[#10a2c5] px-1.5 text-[10px] font-bold text-white">New</span>}
              <span className="absolute bottom-2 left-2 flex items-center gap-1 text-13 font-bold text-white"><Flame size={14} className="fill-white" />{d.views}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-14 xl:min-h-[36px] leading-[18px] font-medium">{d.title}</p>
            <p className="mt-1 text-12 text-muted">Free · {d.episodes} Episodes</p>
            <p className="mt-0.5 text-12 text-muted">{d.genre}</p>
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="py-16 text-center text-muted">No dramas match these filters.</p>}
      {/* wide screens start with 4 rows like the capture; smaller screens list everything */}
      {!more && list.length > 24 && <button onClick={() => setMore(true)} className={`mx-auto mt-8 hidden h-9 rounded-md bg-pill px-4 text-14 font-semibold hover:bg-pill-hover ${list.length > 30 ? 'max-sm:block' : ''} ${list.length > 42 ? 'md:block' : 'xl:block'}`}>Load more dramas</button>}
      <div className="mt-8 flex justify-center gap-0.5" aria-hidden><span className="h-4 w-4 rounded-full bg-brand" /><span className="-ml-1.5 h-4 w-4 rounded-full bg-cyan mix-blend-multiply" /></div>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? `${open.title} · Episode ${ep}` : ''} width={720}>
        {open && (
          <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row">
            <video key={ep} src={videos[(Number(open.id.slice(1)) + ep) % videos.length].src} controls autoPlay muted playsInline className="aspect-[9/16] w-full max-w-[260px] self-center rounded-md bg-black object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-14 text-muted">{open.genre} · {open.episodes} episodes · {open.views} views</p>
              <div className="mt-3 grid grid-cols-6 gap-2">
                {Array.from({ length: Math.min(open.episodes, 30) }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => n <= 10 && setEp(n)} aria-pressed={ep === n}
                    className={`relative flex h-9 items-center justify-center rounded-sm text-14 font-semibold ${ep === n ? 'bg-brand text-white' : 'bg-pill hover:bg-pill-hover'} ${n > 10 ? 'text-muted' : ''}`}>
                    {n}{n > 10 && <Lock size={10} className="absolute right-0.5 top-0.5" />}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-12 text-muted">Episodes 1–10 are free in this demo.</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
