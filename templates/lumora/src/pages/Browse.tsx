import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { byId, homeRows, type Title } from '../data/catalog';
import { useCatalog, useFakeLoading } from '../lib/hooks';
import { useProfileData } from '../store';
import { Billboard } from '../components/Billboard';
import { Row, TitleGrid, type RowItem } from '../components/Row';
import { SkeletonGrid, SkeletonRows } from '../components/Skeleton';
import { Caret, Grid, List } from '../components/Icons';
import { brand } from '../brand.config';

export type BrowseKind = 'all' | 'tv' | 'movies' | 'latest' | 'mylist';

function useContinue(allowedIds: Set<string>): RowItem[] {
  const { progress } = useProfileData();
  return Object.entries(progress)
    .filter(([id, p]) => allowedIds.has(id) && p.t < p.d * 0.97)
    .sort((a, b) => b[1].at - a[1].at)
    .map(([id, p]) => {
      const t = byId(id)!;
      const ep = p.episodeId?.match(/s(\d+)e(\d+)/);
      return { title: t, progress: p.t / Math.max(1, p.d), subtitle: ep ? `ซีซั่น ${ep[1]} ตอนที่ ${ep[2]}` : undefined };
    });
}

function GenreMenu({ genres, value, onChange, label }: { genres: string[]; value: string; onChange: (g: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-6 border border-white bg-black px-2 py-0.5 text-sm font-medium hover:bg-[#ffffff1a]">
        {value || label} <Caret />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 top-full z-20 grid w-max grid-cols-2 gap-x-6 border border-[#ffffff26] bg-black/90 px-3 py-2 text-sm sm:grid-cols-3"
          >
            {['', ...genres].map((g) => (
              <li key={g || 'all'}>
                <button onClick={() => (onChange(g), setOpen(false))} className={`py-1 hover:underline ${g === value ? 'font-semibold text-white' : 'text-[#e5e5e5]'}`}>
                  {g || 'ทั้งหมด'}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubHeader({ kind, genres }: { kind: 'tv' | 'movies'; genres: string[] }) {
  const [params, setParams] = useSearchParams();
  const genre = params.get('g') ?? '';
  const view = params.get('view') === 'grid' ? 'grid' : 'rows';
  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };
  return (
    <div className="app-gutter absolute inset-x-0 top-[41px] z-20 flex h-[52px] items-center gap-6 sm:top-[68px] sm:h-[68px]">
      <h1 className="text-[clamp(22px,2.6vw,38px)] font-medium">{kind === 'tv' ? 'ซีรีส์' : 'ภาพยนตร์'}</h1>
      <GenreMenu genres={genres} value={genre} onChange={(g) => set('g', g)} label="ประเภท" />
      <div className="ml-auto flex border border-white" role="group" aria-label="มุมมอง">
        <button aria-label="แสดงเป็นแถว" aria-pressed={view === 'rows'} onClick={() => set('view', '')} className={`px-2 py-1 ${view === 'rows' ? 'bg-white text-black' : 'bg-black'}`}>
          <List size={16} />
        </button>
        <button aria-label="แสดงเป็นตาราง" aria-pressed={view === 'grid'} onClick={() => set('view', 'grid')} className={`px-2 py-1 ${view === 'grid' ? 'bg-white text-black' : 'bg-black'}`}>
          <Grid size={16} />
        </button>
      </div>
    </div>
  );
}

const items = (ts: Title[]): RowItem[] => ts.map((title) => ({ title }));

export default function Browse({ kind }: { kind: BrowseKind }) {
  const catalog = useCatalog();
  const allowedIds = useMemo(() => new Set(catalog.map((t) => t.id)), [catalog]);
  const [params] = useSearchParams();
  const genre = params.get('g') ?? '';
  const grid = params.get('view') === 'grid';
  const loading = useFakeLoading(kind + genre);
  const cont = useContinue(allowedIds);
  const { myList } = useProfileData();
  const list = myList.map(byId).filter((t): t is Title => !!t && allowedIds.has(t.id));

  const filter = kind === 'tv' ? 'tv' : kind === 'movies' ? 'movies' : 'all';
  const rows = useMemo(
    () =>
      homeRows(filter, genre || undefined)
        .map((r) => ({ ...r, items: r.items.filter((t) => allowedIds.has(t.id)) }))
        .filter((r) => r.items.length > 0),
    [filter, genre, allowedIds],
  );
  const pool = catalog.filter((t) => (filter === 'all' || (filter === 'tv') === (t.kind === 'series')) && (!genre || t.genres.includes(genre)));
  const genres = Array.from(new Set(catalog.filter((t) => filter === 'all' || (filter === 'tv') === (t.kind === 'series')).flatMap((t) => t.genres))).sort();
  const hero = pool[(new Date().getDate() + filter.length) % Math.max(1, pool.length)];

  if (kind === 'mylist' || kind === 'latest') {
    const latestRows: [string, RowItem[], ('top10' | undefined)?][] = [
      [`มาใหม่บน ${brand.name}`, items(catalog.filter((t) => t.isNew))],
      ['คุ้มค่ากับการรอ', catalog.filter((t) => t.year >= 2026).map((title) => ({ title, subtitle: 'เร็วๆ นี้' }))],
      ['ซีรีส์ 10 อันดับแรกในประเทศไทยวันนี้', items(catalog.filter((t) => t.kind === 'series').slice(0, 10)), 'top10'],
      ['ภาพยนตร์ 10 อันดับแรกในประเทศไทยวันนี้', items(catalog.filter((t) => t.kind === 'movie').slice(0, 10)), 'top10'],
      ['กำลังมาแรงสัปดาห์นี้', items([...catalog].sort((a, b) => b.match - a.match))],
    ];
    return (
      <main className="min-h-screen pt-[90px] sm:pt-[110px]">
        {kind === 'mylist' ? (
          <div className="app-gutter">
            <h1 className="mb-8 text-[clamp(22px,2.6vw,38px)] font-medium">รายการของฉัน</h1>
            {loading ? <SkeletonGrid count={6} /> : list.length ? <TitleGrid items={items(list)} /> : <p className="py-20 text-center text-lg text-[#999]">คุณยังไม่ได้เพิ่มเรื่องใดลงในรายการของคุณ</p>}
          </div>
        ) : loading ? (
          <SkeletonRows rows={4} billboard={false} />
        ) : (
          latestRows.filter(([, its]) => its.length).map(([title, its, v]) => <Row key={title} title={title} items={its} variant={v} />)
        )}
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-clip pb-12">
      {kind !== 'all' && <SubHeader kind={kind} genres={genres} />}
      {loading ? (
        <SkeletonRows rows={4} billboard />
      ) : grid && kind !== 'all' ? (
        <div className="app-gutter pt-[150px]">
          <TitleGrid items={items(pool)} />
        </div>
      ) : (
        <>
          {hero && <Billboard t={hero} />}
          <div className="relative z-10 -mt-[8vw] max-sm:mt-0">
            {rows.slice(0, 2).map((r) => (
              <Row key={r.id} title={r.title} items={items(r.items)} variant={r.variant} />
            ))}
            {kind === 'all' && cont.length > 0 && <Row title="ดูต่อสำหรับโปรไฟล์นี้" items={cont} variant="continue" />}
            {kind === 'all' && list.length > 0 && <Row title="รายการของฉัน" items={items(list)} />}
            {rows.slice(2).map((r) => (
              <Row key={r.id} title={r.title} items={items(r.items)} variant={r.variant} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
