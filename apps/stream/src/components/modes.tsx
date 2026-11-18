import { subsystems } from "@empire/core/subsystems";
import { ArrowUpRight, Play, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { type Kind, type Video } from "@/lib/api";
import { allVideos, useData } from "@/lib/data";
import { filters, searchPage, shuffle, type Hit } from "@/lib/search";
import { env } from "@/lib/env";
import { thumb } from "@/lib/youtube";
import { resumeAt, usePlayer } from "./player";

/** Pages of 50; three is about 150 clips per search, and each page costs quota. */
export const MAX_PAGES = 3;

const dedupe = (list: Hit[]) => {
  const seen = new Set<string>();
  return list.filter((v) => !seen.has(v.youtube_id) && !!seen.add(v.youtube_id));
};

type Found = {
  key: string;
  hits: Hit[];
  next: string | null;
  pages: number;
  error: string | null;
  moreError: string | null;
};

/**
 * Live YouTube results for ?q= in this mode, through our Worker, with YouTube's filters from the
 * URL. Sorted by relevance, every search comes back in a new order; "more" adds a page at a time.
 */
function useSearch(kind: Kind) {
  const [params] = useSearchParams();
  const q = params.get("q")?.trim() ?? "";
  const { order, when, length } = filters.parse(Object.fromEntries(params));
  const [found, setFound] = useState<Found>();
  const [tries, setTries] = useState(0);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const key = `${kind}:${q}:${order}:${when}:${length}:${tries}`;
  const mix = useCallback((hits: Hit[]) => (order === "relevance" ? shuffle(hits) : hits), [order]);
  const busy = busyKey === key;

  useEffect(() => {
    if (!q) return;
    const stop = new AbortController();
    searchPage({ q, kind, order, when, length }, stop.signal).then(
      (page) =>
        setFound({
          key,
          hits: mix(page.hits),
          next: page.next,
          pages: 1,
          error: null,
          moreError: null,
        }),
      (e: unknown) => {
        if (!stop.signal.aborted)
          setFound({
            key,
            hits: [],
            next: null,
            pages: 0,
            error: e instanceof Error ? e.message : "ค้นหาไม่สำเร็จ",
            moreError: null,
          });
      },
    );
    return () => stop.abort();
  }, [q, kind, order, when, length, key, mix]);

  const done = found?.key === key ? found : undefined;
  const canMore = !!done?.next && done.pages < MAX_PAGES;
  const more = useCallback(() => {
    if (!done?.next || busy) return;
    setBusyKey(key);
    searchPage({ q, kind, order, when, length, page: done.next })
      .then(
        (page) =>
          setFound((f) =>
            f?.key === key
              ? {
                  ...f,
                  hits: dedupe([...f.hits, ...mix(page.hits)]),
                  next: page.next,
                  pages: f.pages + 1,
                  moreError: null,
                }
              : f,
          ),
        (e: unknown) =>
          setFound((f) =>
            f?.key === key
              ? { ...f, moreError: e instanceof Error ? e.message : "โหลดเพิ่มไม่สำเร็จ" }
              : f,
          ),
      )
      .finally(() => {
        setBusyKey((k) => (k === key ? null : k));
      });
  }, [done, busy, q, kind, order, when, length, key, mix]);

  return {
    q,
    hits: done?.hits ?? [],
    loaded: !!done,
    error: done?.error ?? null,
    retry: useCallback(() => setTries((n) => n + 1), []),
    more: canMore ? more : null,
    busy,
    moreError: done?.moreError ?? null,
  };
}

/**
 * Every video of one kind (own first), plus the ones the viewer stopped part way through.
 * While a search is open (?q=), the mode shows YouTube's results instead, in its own style.
 */
export function useLibrary(kind?: Kind) {
  const { featured, mine, progress, loaded, error, refresh } = useData();
  const search = useSearch(kind ?? "video");
  const { q, hits, loaded: found, error: missed, retry, more, busy, moreError } = search;
  return useMemo(() => {
    if (q) {
      const list: Video[] = hits;
      return {
        all: list,
        featured: list,
        mine: [] as Video[],
        resume: [] as Video[],
        progress,
        loaded: found,
        error: missed,
        refresh: retry,
        query: q,
        more,
        busy,
        moreError,
      };
    }
    const all = allVideos(featured, mine);
    const byId = new Map(all.map((v) => [v.youtube_id, v]));
    const ofKind = (list: Video[]) => (kind ? list.filter((v) => v.kind === kind) : list);
    const resume = [...progress.values()]
      .filter((p) => resumeAt(p.seconds, p.duration) > 0)
      .flatMap((p) => byId.get(p.youtube_id) ?? []);
    return {
      all: ofKind(all),
      featured: ofKind(featured),
      mine: ofKind(mine),
      resume: ofKind(resume),
      progress,
      loaded,
      error,
      refresh,
      query: "",
      more: null,
      busy: false,
      moreError: null,
    };
  }, [
    featured,
    mine,
    progress,
    loaded,
    error,
    refresh,
    kind,
    q,
    hits,
    found,
    missed,
    retry,
    more,
    busy,
    moreError,
  ]);
}

type Lib = ReturnType<typeof useLibrary>;

/** "More results": the next page of the same search, up to MAX_PAGES. */
export function More({ lib }: { lib: Lib }) {
  if (!lib.more && !lib.moreError) return null;
  return (
    <div className="grid place-items-center gap-2 py-8">
      {lib.moreError && (
        <p role="alert" className="text-sm text-[var(--muted-foreground)]">
          {lib.moreError}
        </p>
      )}
      {lib.more && (
        <button
          type="button"
          onClick={lib.more}
          disabled={lib.busy}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[color-mix(in_oklab,var(--foreground)_18%,transparent)] px-5 font-semibold text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] disabled:opacity-60"
        >
          {lib.busy ? "กำลังโหลด…" : "ดูผลเพิ่ม"}
        </button>
      )}
    </div>
  );
}

function Page({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--primary)]">
        {eyebrow}
      </p>
      <h1 className="mb-4 text-3xl font-black text-[var(--foreground)]">{title}</h1>
      {children}
    </div>
  );
}

export function Status({ lib, empty }: { lib: Lib; empty: string }) {
  if (!lib.loaded)
    return (
      <p className="py-10 text-center text-[var(--muted-foreground)]">
        {lib.query ? "กำลังค้นใน YouTube…" : "กำลังโหลด…"}
      </p>
    );
  if (lib.error)
    return (
      <p role="alert" className="py-10 text-center text-[var(--muted-foreground)]">
        {lib.error}{" "}
        <button type="button" onClick={lib.refresh} className="text-[var(--primary)] underline">
          ลองใหม่
        </button>
      </p>
    );
  if (lib.query)
    return (
      <p className="py-10 text-center text-[var(--muted-foreground)]">
        ไม่พบคลิปที่ตรงกับ “{lib.query}” ในโหมดนี้ ลองคำอื่นหรือโหมดอื่น
      </p>
    );
  return (
    <div className="grid place-items-center gap-3 rounded-xl border border-dashed border-[color-mix(in_oklab,var(--foreground)_18%,transparent)] px-4 py-12 text-center">
      <p className="text-[var(--muted-foreground)]">{empty}</p>
      {/* the search field sits in the header on every page */}
      <label
        htmlFor="search"
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md bg-[var(--em-blue-600)] px-4 font-semibold text-[var(--em-ink-0)] hover:bg-[var(--em-blue-500)]"
      >
        <Search className="size-4" aria-hidden /> ค้นหาใน YouTube
      </label>
    </div>
  );
}

/** How far through a video the viewer got, as a thin bar on its thumbnail. */
export function Seen({ id }: { id: string }) {
  const p = useData().progress.get(id);
  if (!p || !(p.duration > 0)) return null;
  const pct = Math.min(100, (p.seconds / p.duration) * 100);
  return (
    <span
      aria-hidden
      className="absolute inset-x-0 bottom-0 h-1 bg-[color-mix(in_oklab,var(--em-ink-0)_25%,transparent)]"
    >
      <span className="block h-full bg-[var(--em-blue-500)]" style={{ width: `${pct}%` }} />
    </span>
  );
}

/** Other crocwork apps, shown between Shorts so people find the rest of the studio. */
const PROMOS = subsystems.filter((s) => s.slug !== "stream");

/** TikTok style: one tall card per screen, swipe to the next. */
export function ShortsPage() {
  const lib = useLibrary("short");
  const items = lib.all;
  if (items.length === 0)
    return (
      <Page eyebrow="Shorts" title="Shorts">
        <Status lib={lib} empty="ยังไม่มีคลิปสั้น ลองค้นหาดู" />
      </Page>
    );
  const feed = items.flatMap((v, i) => {
    const promo = (i + 1) % 3 === 0 ? PROMOS[((i + 1) / 3 - 1) % PROMOS.length] : undefined;
    return promo ? [{ v }, { promo }] : [{ v }];
  });
  return (
    <div className="st-no-scrollbar mx-auto h-full max-w-sm snap-y snap-mandatory overflow-y-auto px-4 py-3">
      <h1 className="sr-only">Shorts</h1>
      {feed.map((f, i) =>
        "v" in f && f.v ? (
          <ShortCard key={f.v.youtube_id} v={f.v} list={items} />
        ) : (
          <a
            key={`promo-${i}`}
            href={`${env.hubUrl}/go/${f.promo.slug}`}
            className="mb-3 flex aspect-[9/16] max-h-full snap-center flex-col justify-end gap-2 rounded-xl p-5 text-[var(--em-ink-0)]"
            style={{ background: `linear-gradient(180deg, transparent, ${f.promo.accent})` }}
          >
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--em-ink-200)]">
              crocwork
            </span>
            <span className="text-2xl font-black">{f.promo.name}</span>
            <span className="text-sm text-[var(--em-ink-100)]">{f.promo.summary}</span>
            <span className="mt-2 inline-flex items-center gap-1 font-semibold">
              เปิดดู <ArrowUpRight className="size-4" aria-hidden />
            </span>
          </a>
        ),
      )}
    </div>
  );
}

function ShortCard({ v, list }: { v: Video; list: Video[] }) {
  const { play } = usePlayer();
  return (
    <button
      type="button"
      onClick={() => play(v, list)}
      className="relative mb-3 block aspect-[9/16] max-h-full w-full snap-center overflow-hidden rounded-xl bg-[var(--muted)] text-left"
    >
      <img
        src={thumb(v.youtube_id)}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
      <span aria-hidden className="st-hero-fade absolute inset-0" />
      <span className="absolute inset-x-0 bottom-0 grid gap-1 p-4">
        <span className="line-clamp-2 font-bold text-[var(--em-ink-0)]">{v.title}</span>
        <span className="truncate text-sm text-[var(--em-ink-200)]">{v.author}</span>
      </span>
      <span className="absolute left-1/2 top-1/2 grid size-16 -translate-1/2 place-items-center rounded-full bg-[color-mix(in_oklab,var(--em-ink-975)_55%,transparent)]">
        <Play className="size-7 fill-[var(--em-ink-0)] text-[var(--em-ink-0)]" aria-hidden />
      </span>
    </button>
  );
}
