import { cn } from "@empire/ui";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  LayoutGrid,
  Play,
  Rows3,
  X,
} from "lucide-react";
import { type SyntheticEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Video } from "@/lib/api";
import { searchVideos, type Hit } from "@/lib/search";
import { timeAgo } from "@/lib/time";
import { thumb } from "@/lib/youtube";
import { More, Seen, Status, useLibrary } from "./modes";
import { usePlayer } from "./player";

/**
 * Movies in the netflixcraft Browse layout: a billboard, a title bar with genres and a
 * rows/grid switch, then paged rows whose cards grow into a preview on a held hover.
 */

/** Cards per row at a window width (the reference's steps). */
export const perRow = (w: number) =>
  w >= 1400 ? 6 : w >= 1100 ? 5 : w >= 800 ? 4 : w >= 500 ? 3 : 2;

/** Something the viewer is part way through, else a pick that changes once a day. */
export function pickHero(resume: Video[], pool: Video[], day = Math.floor(Date.now() / 864e5)) {
  return resume[0] ?? (pool.length ? pool[day % pool.length] : undefined);
}

/** Added or published within the last 30 days. */
export const isNew = (iso: string, now = Date.now()) => now - Date.parse(iso) < 30 * 864e5;

// genre rows are live YouTube searches; the Worker caches each answer for 6 h
export const GENRES = [
  { id: "thai", label: "หนังไทย", q: "หนังไทย เต็มเรื่อง" },
  { id: "action", label: "แอ็กชัน", q: "หนังแอ็คชั่น เต็มเรื่อง" },
  { id: "horror", label: "สยองขวัญ", q: "หนังผี เต็มเรื่อง" },
  { id: "comedy", label: "ตลก", q: "หนังตลก เต็มเรื่อง" },
  { id: "animation", label: "แอนิเมชัน", q: "การ์ตูน เต็มเรื่อง พากย์ไทย" },
] as const;

function useGenres(on: boolean) {
  const [rows, setRows] = useState<Record<string, Hit[]>>({});
  useEffect(() => {
    if (!on) return;
    const stop = new AbortController();
    for (const g of GENRES)
      searchVideos(g.q, "movie", stop.signal).then(
        (hits) => setRows((r) => ({ ...r, [g.id]: hits })),
        // search off or quota spent: that row just does not show
        () => undefined,
      );
    return () => stop.abort();
  }, [on]);
  return rows;
}

const onResize = (f: () => void) => {
  addEventListener("resize", f);
  return () => removeEventListener("resize", f);
};
const useWidth = () =>
  useSyncExternalStore(
    onResize,
    () => innerWidth,
    () => 1280,
  );

type Open = (v: Video, list: Video[]) => void;

export function MoviesPage() {
  const lib = useLibrary("movie");
  const genres = useGenres(!lib.query);
  const [view, setView] = useState<"rows" | "grid">("rows");
  const [genre, setGenre] = useState("");
  const [info, setInfo] = useState<{ v: Video; list: Video[] }>();
  const per = perRow(useWidth());
  const open: Open = (v, list) => setInfo({ v, list });
  const of = (id: string): Video[] => genres[id] ?? [];

  const dialog = info && <InfoDialog {...info} onClose={() => setInfo(undefined)} />;

  if (lib.query)
    return (
      <div className="pt-6 pb-10">
        <h1 className="mb-6 px-[4%] text-[clamp(22px,2.6vw,38px)] font-medium">
          ผลค้นหา “{lib.query}”
        </h1>
        {lib.all.length ? (
          <TitleGrid items={lib.all} per={per} onInfo={open} />
        ) : (
          <div className="px-[4%]">
            <Status lib={lib} empty="" />
          </div>
        )}
        <More lib={lib} />
        {dialog}
      </div>
    );

  const everything = dedupe([...lib.all, ...GENRES.flatMap((g) => of(g.id))]);
  const hero = pickHero(lib.resume, lib.featured.length ? lib.featured : everything);
  if (!hero)
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <Status
          lib={lib}
          empty="ยังไม่มีหนัง ลองค้นหนังเต็มเรื่องที่เจ้าของเปิดให้ดูฟรีบน YouTube"
        />
      </div>
    );

  const [first, ...rest] = GENRES;
  const rows: [string, Video[], boolean?][] = [
    ["แนะนำสำหรับคุณ", lib.featured],
    [first.label, of(first.id)],
    ["ดูต่อสำหรับคุณ", lib.resume],
    ["รายการของฉัน", lib.mine],
    ["10 อันดับหนังไทยวันนี้", of(first.id).slice(0, 10), true],
    ...rest.map((g): [string, Video[]] => [g.label, of(g.id)]),
  ];
  const grid = genre ? of(genre) : view === "grid" ? everything : null;

  return (
    <div className="pb-10">
      <div className="relative">
        <Billboard v={hero} resuming={lib.resume.includes(hero)} list={everything} onInfo={open} />
        <div className="absolute inset-x-0 top-0 z-20 flex h-[52px] items-center gap-4 bg-gradient-to-b from-[color-mix(in_oklab,var(--background)_70%,transparent)] to-transparent px-[4%] sm:h-[68px] sm:gap-8">
          <h1 className="text-[clamp(22px,2.6vw,38px)] font-medium text-[var(--foreground)]">
            {genre ? (GENRES.find((g) => g.id === genre)?.label ?? "ภาพยนตร์") : "ภาพยนตร์"}
          </h1>
          <label className="relative">
            <span className="sr-only">ประเภท</span>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="min-h-9 appearance-none border border-[var(--foreground)] bg-[var(--background)] py-0.5 pr-8 pl-2 text-sm text-[var(--foreground)]"
            >
              <option value="">ประเภททั้งหมด</option>
              {GENRES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-1.5 size-4 -translate-y-1/2"
              aria-hidden
            />
          </label>
          <div className="ml-auto flex" role="group" aria-label="มุมมอง">
            {(
              [
                ["rows", "แถว", Rows3],
                ["grid", "ตาราง", LayoutGrid],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                aria-pressed={view === id}
                aria-label={label}
                onClick={() => setView(id)}
                className={cn(
                  "grid size-9 place-items-center border border-[var(--foreground)]",
                  view === id
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "bg-[var(--background)] text-[var(--foreground)]",
                )}
              >
                <Icon className="size-4" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="relative z-10 -mt-[8vw] max-sm:mt-4">
        {grid ? (
          <TitleGrid items={grid} per={per} onInfo={open} />
        ) : (
          rows.map(([title, items, top]) => (
            <Row key={title} title={title} items={items} per={per} top={top} onInfo={open} />
          ))
        )}
      </div>
      {dialog}
    </div>
  );
}

/** The full-size cover, or the standard one when YouTube has none (it then serves a 120 px grey card). */
const cover = (id: string) => ({
  src: thumb(id, "max"),
  onLoad: (e: SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.naturalWidth <= 120) e.currentTarget.src = thumb(id);
  },
  onError: (e: SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = thumb(id);
  },
});

const dedupe = (list: Video[]) => [...new Map(list.map((v) => [v.youtube_id, v])).values()];

function Billboard({
  v,
  list,
  resuming,
  onInfo,
}: {
  v: Video;
  list: Video[];
  resuming: boolean;
  onInfo: Open;
}) {
  const { play } = usePlayer();
  return (
    <section
      aria-label="แนะนำวันนี้"
      className="relative h-[56.25vw] max-h-[85vh] min-h-[320px] w-full overflow-hidden"
    >
      <img {...cover(v.youtube_id)} alt="" className="absolute inset-0 size-full object-cover" />
      <div aria-hidden className="st-bill-side absolute inset-0" />
      <div aria-hidden className="st-bill-foot absolute inset-x-0 bottom-0 h-[14.7vw]" />
      <div className="absolute bottom-[35%] left-[4%] w-[36%] min-w-[260px] max-sm:bottom-[14%] max-sm:w-[86%]">
        <h2 className="st-bill-title line-clamp-3 font-heading text-[clamp(26px,3.4vw,60px)] leading-[1.05] font-black text-[var(--foreground)]">
          {v.title}
        </h2>
        <p className="mt-[1vw] text-[max(14px,1.2vw)] text-[var(--foreground)] max-sm:hidden">
          {v.author}
          {v.created_at && ` · ${timeAgo(v.created_at)}`}
        </p>
        <div className="mt-[1.5vw] flex gap-2.5 max-sm:mt-3">
          <button
            type="button"
            onClick={() => play(v, list)}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-[var(--foreground)] px-[max(1.5rem,2.4vw)] py-[0.6vw] text-[max(16px,1.2vw)] font-semibold text-[var(--background)] hover:bg-[color-mix(in_oklab,var(--foreground)_75%,transparent)]"
          >
            <Play className="size-6 fill-current" aria-hidden />
            {resuming ? "ดูต่อ" : "เล่น"}
          </button>
          <button
            type="button"
            onClick={() => onInfo(v, list)}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-[color-mix(in_oklab,var(--muted-foreground)_55%,transparent)] px-[max(1.5rem,2.4vw)] py-[0.6vw] text-[max(16px,1.2vw)] font-semibold text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--muted-foreground)_35%,transparent)]"
          >
            <Info className="size-6" aria-hidden />
            ข้อมูลเพิ่มเติม
          </button>
        </div>
      </div>
    </section>
  );
}

function Row({
  title,
  items,
  per,
  top,
  onInfo,
}: {
  title: string;
  items: Video[];
  per: number;
  top?: boolean;
  onInfo: Open;
}) {
  const [page, setPage] = useState(0);
  const [moved, setMoved] = useState(false);
  if (!items.length) return null;
  const pages = Math.ceil(items.length / per);
  const at = Math.min(page, pages - 1); // the window may have grown since
  const go = (step: number) => {
    setMoved(true);
    setPage((at + step + pages) % pages);
  };
  const arrow =
    "absolute top-0 bottom-0 z-10 grid w-[4%] place-items-center bg-[color-mix(in_oklab,var(--background)_50%,transparent)] text-[var(--foreground)] opacity-0 group-hover/row:opacity-100 hover:bg-[color-mix(in_oklab,var(--background)_70%,transparent)] focus-visible:opacity-100 [@media(hover:none)]:opacity-100";
  return (
    <section aria-label={title} className="group/row relative mb-[3vw] hover:z-20 max-sm:mb-6">
      <div className="mb-[0.5em] flex items-end justify-between px-[4%]">
        <h2 className="text-[max(14px,1.4vw)] font-medium text-[var(--foreground)]">{title}</h2>
        {pages > 1 && (
          <ol aria-hidden className="flex gap-0.5 opacity-0 group-hover/row:opacity-100">
            {Array.from({ length: pages }, (_, i) => (
              <li
                key={i}
                className={cn(
                  "h-[2px] w-3",
                  i === at
                    ? "bg-[var(--muted-foreground)]"
                    : "bg-[color-mix(in_oklab,var(--muted-foreground)_35%,transparent)]",
                )}
              />
            ))}
          </ol>
        )}
      </div>
      <div className="relative overflow-x-clip px-[4%]">
        <ul
          className="flex transition-transform duration-[750ms] ease-[cubic-bezier(.5,0,.1,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(${-at * 100}%)` }}
        >
          {items.map((v, i) => (
            <Card
              key={v.youtube_id}
              v={v}
              list={items}
              per={per}
              i={i}
              rank={top ? i + 1 : undefined}
              onInfo={onInfo}
            />
          ))}
        </ul>
        {pages > 1 && (
          <>
            {moved && (
              <button
                type="button"
                aria-label="ก่อนหน้า"
                onClick={() => go(-1)}
                className={cn(arrow, "group/btn left-0")}
              >
                <ChevronLeft className="size-8 transition-transform group-hover/btn:scale-125" />
              </button>
            )}
            <button
              type="button"
              aria-label="ถัดไป"
              onClick={() => go(1)}
              className={cn(arrow, "group/btn right-0")}
            >
              <ChevronRight className="size-8 transition-transform group-hover/btn:scale-125" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function TitleGrid({ items, per, onInfo }: { items: Video[]; per: number; onInfo: Open }) {
  return (
    <ul className="flex flex-wrap gap-y-10 px-[4%]">
      {items.map((v, i) => (
        <Card key={v.youtube_id} v={v} list={items} per={per} i={i} onInfo={onInfo} />
      ))}
    </ul>
  );
}

/** A title card; held under the pointer for 350 ms it grows into a preview with actions. */
function Card({
  v,
  list,
  per,
  i,
  rank,
  onInfo,
}: {
  v: Video;
  list: Video[];
  per: number;
  i: number;
  rank?: number;
  onInfo: Open;
}) {
  const { play } = usePlayer();
  // the first and last card of a page grow inwards so they never leave the screen
  const origin = i % per === 0 ? "origin-left" : i % per === per - 1 ? "origin-right" : "";
  const fresh = isNew(v.created_at);
  return (
    <li
      className="group/card relative shrink-0 px-[0.2vw] hover:z-30"
      style={{ width: `${100 / per}%` }}
    >
      <div
        className={cn(
          "relative transition-transform duration-300 ease-out group-hover/card:scale-[1.4] group-hover/card:delay-[350ms] motion-reduce:transition-none",
          origin,
        )}
      >
        <button
          type="button"
          aria-label={v.title}
          onClick={() => play(v, list)}
          className="relative flex aspect-video w-full overflow-hidden rounded-sm bg-[var(--muted)] group-hover/card:rounded-b-none"
        >
          {rank && <Rank n={rank} />}
          <img
            src={thumb(v.youtube_id)}
            alt=""
            loading="lazy"
            className={cn("h-full object-cover", rank ? "w-1/2" : "w-full")}
          />
          {fresh && !rank && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-sm bg-[var(--em-blue-600)] px-1.5 py-px text-[10px] font-semibold text-[var(--em-ink-0)]">
              มาใหม่
            </span>
          )}
          <Seen id={v.youtube_id} />
        </button>
        <div className="pointer-events-none absolute inset-x-0 top-full rounded-b-md bg-[var(--card)] p-2 opacity-0 shadow-[0_3px_10px_color-mix(in_oklab,var(--em-ink-975)_60%,transparent)] transition-opacity group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100 group-hover/card:pointer-events-auto group-hover/card:opacity-100 group-hover/card:delay-[350ms]">
          <div className="mb-1.5 flex items-center gap-1">
            <button
              type="button"
              aria-label={`เล่น ${v.title}`}
              onClick={() => play(v, list)}
              className="grid size-6 place-items-center rounded-full bg-[var(--foreground)] text-[var(--background)] hover:opacity-80"
            >
              <Play className="size-3 fill-current" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={`ข้อมูลเพิ่มเติม ${v.title}`}
              onClick={() => onInfo(v, list)}
              className="ml-auto grid size-6 place-items-center rounded-full border border-[color-mix(in_oklab,var(--foreground)_60%,transparent)] text-[var(--foreground)] hover:border-[var(--foreground)]"
            >
              <ChevronDown className="size-3.5" aria-hidden />
            </button>
          </div>
          <p className="line-clamp-2 text-[10px] leading-tight font-semibold text-[var(--foreground)]">
            {v.title}
          </p>
          <p className="mt-0.5 truncate text-[8px] text-[var(--muted-foreground)]">
            {fresh && <span className="font-semibold text-[var(--primary)]">มาใหม่ · </span>}
            {v.author}
          </p>
        </div>
      </div>
    </li>
  );
}

/** The outlined rank numeral of a top-10 card. */
function Rank({ n }: { n: number }) {
  return (
    <svg viewBox={`0 0 ${n === 10 ? 160 : 100} 154`} className="h-full w-1/2 shrink-0" aria-hidden>
      <text
        x="100%"
        y="148"
        textAnchor="end"
        fontSize="170"
        fontWeight="900"
        strokeWidth="5"
        paintOrder="stroke"
        className="fill-[var(--background)] stroke-[var(--muted-foreground)] font-heading"
      >
        {n}
      </text>
    </svg>
  );
}

function InfoDialog({ v, list, onClose }: { v: Video; list: Video[]; onClose: () => void }) {
  const { play } = usePlayer();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => ref.current?.showModal(), []);
  const more = list.filter((x) => x.youtube_id !== v.youtube_id).slice(0, 6);
  const start = (x: Video) => {
    ref.current?.close();
    play(x, list);
  };
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
      aria-label={v.title}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(850px,calc(100vw-1rem))] overflow-y-auto overscroll-contain rounded-md bg-[var(--card)] p-0 text-[var(--foreground)] backdrop:bg-[color-mix(in_oklab,var(--em-ink-975)_70%,transparent)]"
    >
      <div className="relative aspect-video">
        <img {...cover(v.youtube_id)} alt="" className="size-full object-cover" />
        <div aria-hidden className="st-info-foot absolute inset-x-0 bottom-0 h-1/2" />
        <button
          type="button"
          aria-label="ปิด"
          onClick={() => ref.current?.close()}
          className="absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-[var(--card)] hover:opacity-80"
        >
          <X className="size-6" aria-hidden />
        </button>
        <div className="absolute bottom-[8%] left-[5%] right-[5%]">
          <h2 className="mb-4 line-clamp-2 font-heading text-[clamp(20px,3vw,34px)] leading-tight font-black">
            {v.title}
          </h2>
          <button
            type="button"
            onClick={() => start(v)}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-[var(--foreground)] px-6 font-semibold text-[var(--background)] hover:bg-[color-mix(in_oklab,var(--foreground)_75%,transparent)]"
          >
            <Play className="size-6 fill-current" aria-hidden />
            เล่น
          </button>
        </div>
      </div>
      <div className="grid gap-6 p-[5%] pt-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          <span className="text-[var(--foreground)]">{v.author}</span>
          {v.created_at && ` · ${timeAgo(v.created_at)}`}
        </p>
        {more.length > 0 && (
          <section>
            <h3 className="mb-4 text-xl font-bold">เรื่องที่คล้ายกัน</h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {more.map((x) => (
                <li key={x.youtube_id}>
                  <button
                    type="button"
                    onClick={() => start(x)}
                    className="grid w-full gap-2 overflow-hidden rounded-sm bg-[var(--muted)] text-left hover:opacity-90"
                  >
                    <img
                      src={thumb(x.youtube_id)}
                      alt=""
                      loading="lazy"
                      className="aspect-video w-full object-cover"
                    />
                    <span className="line-clamp-2 px-2 pb-2 text-sm">{x.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </dialog>
  );
}
