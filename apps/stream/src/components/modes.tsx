import { subsystems } from "@empire/core/subsystems";
import { cn } from "@empire/ui";
import { ArrowUpRight, Play, Plus, Shuffle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import { type Kind, type Video } from "@/lib/api";
import { allVideos, useData } from "@/lib/data";
import { searchVideos, type Hit } from "@/lib/search";
import { env } from "@/lib/env";
import { thumb } from "@/lib/youtube";
import { resumeAt, usePlayer } from "./player";

/** Live YouTube results for ?q= in this mode, through our Worker. */
function useSearch(kind: Kind) {
  const q = useSearchParams()[0].get("q")?.trim() ?? "";
  const [found, setFound] = useState<{ key: string; hits: Hit[]; error: string | null }>();
  const [tries, setTries] = useState(0);
  const key = `${kind}:${q}:${tries}`;
  useEffect(() => {
    if (!q) return;
    const stop = new AbortController();
    searchVideos(q, kind, stop.signal).then(
      (hits) => setFound({ key, hits, error: null }),
      (e: unknown) => {
        if (!stop.signal.aborted)
          setFound({ key, hits: [], error: e instanceof Error ? e.message : "ค้นหาไม่สำเร็จ" });
      },
    );
    return () => stop.abort();
  }, [q, kind, key]);
  const done = found?.key === key ? found : undefined;
  return {
    q,
    hits: done?.hits ?? [],
    loaded: !!done,
    error: done?.error ?? null,
    retry: useCallback(() => setTries((n) => n + 1), []),
  };
}

/**
 * Every video of one kind (own first), plus the ones the viewer stopped part way through.
 * While a search is open (?q=), the mode shows YouTube's results instead, in its own style.
 */
export function useLibrary(kind?: Kind) {
  const { featured, mine, progress, loaded, error, refresh } = useData();
  const { q, hits, loaded: found, error: missed, retry } = useSearch(kind ?? "video");
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
    };
  }, [featured, mine, progress, loaded, error, refresh, kind, q, hits, found, missed, retry]);
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

export function Status({ lib, empty }: { lib: ReturnType<typeof useLibrary>; empty: string }) {
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
      <Link
        to="/add"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-[var(--em-blue-600)] px-4 font-semibold text-[var(--em-ink-0)] hover:bg-[var(--em-blue-500)]"
      >
        <Plus className="size-4" aria-hidden /> วางลิงก์ YouTube
      </Link>
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

function VideoCard({ v, list, className }: { v: Video; list: Video[]; className?: string }) {
  const { play } = usePlayer();
  return (
    <button
      type="button"
      onClick={() => play(v, list)}
      className={cn("group grid gap-2 text-left", className)}
    >
      <span className="relative block aspect-video overflow-hidden rounded-lg bg-[var(--muted)]">
        <img
          src={thumb(v.youtube_id)}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <Seen id={v.youtube_id} />
      </span>
      <span className="min-w-0">
        <span className="line-clamp-2 text-sm font-semibold text-[var(--foreground)]">
          {v.title}
        </span>
        <span className="block truncate text-xs text-[var(--muted-foreground)]">{v.author}</span>
      </span>
    </button>
  );
}

function Shelf({ title, items }: { title: string; items: Video[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-6">
      <h2 className="mb-2 font-heading text-lg font-bold text-[var(--foreground)]">{title}</h2>
      <ul className="st-no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {items.map((v) => (
          <li key={v.youtube_id} className="w-60 shrink-0 snap-start sm:w-64">
            <VideoCard v={v} list={items} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Grid({ items }: { items: Video[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((v) => (
        <li key={v.youtube_id}>
          <VideoCard v={v} list={items} />
        </li>
      ))}
    </ul>
  );
}

/** YouTube style: what to finish first, then everything as a grid. */
export function VideosPage() {
  const lib = useLibrary("video");
  return (
    <Page eyebrow="Videos" title="วิดีโอ">
      <Shelf title="ดูต่อ" items={lib.resume} />
      {lib.all.length ? <Grid items={lib.all} /> : <Status lib={lib} empty="ยังไม่มีวิดีโอ" />}
    </Page>
  );
}

/** Spotify style: a track list and a play-all queue; fold the player and keep listening. */
export function MusicPage() {
  const lib = useLibrary("music");
  const { play, current } = usePlayer();
  const list = lib.all;
  return (
    <Page eyebrow="Music" title="เพลง">
      {list.length === 0 ? (
        <Status lib={lib} empty="ยังไม่มีเพลง" />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const [first] = list;
                if (first) play(first, list);
              }}
              className="inline-flex min-h-12 items-center gap-2 rounded-md bg-[var(--em-blue-600)] px-5 font-bold text-[var(--em-ink-0)] hover:bg-[var(--em-blue-500)]"
            >
              <Play className="size-5 fill-current" aria-hidden /> เล่นทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => {
                const mixed = [...list].sort(() => Math.random() - 0.5);
                const [first] = mixed;
                if (first) play(first, mixed);
              }}
              className="inline-flex min-h-12 items-center gap-2 rounded-md border border-[color-mix(in_oklab,var(--foreground)_18%,transparent)] px-5 hover:bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]"
            >
              <Shuffle className="size-4" aria-hidden /> สุ่ม
            </button>
          </div>
          <p className="mb-3 text-sm text-[var(--muted-foreground)]">
            ย่อเครื่องเล่นแล้วไปหน้าอื่นได้ เพลงเล่นต่อจนจบคิว
          </p>
          <ol className="grid gap-1">
            {list.map((v, i) => {
              const on = current?.youtube_id === v.youtube_id;
              return (
                <li key={v.youtube_id}>
                  <button
                    type="button"
                    onClick={() => play(v, list)}
                    aria-current={on || undefined}
                    className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]"
                  >
                    <span className="w-6 text-right text-sm tabular-nums text-[var(--muted-foreground)]">
                      {i + 1}
                    </span>
                    <img
                      src={thumb(v.youtube_id)}
                      alt=""
                      loading="lazy"
                      className="size-12 rounded object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate font-semibold",
                          on ? "text-[var(--primary)]" : "text-[var(--foreground)]",
                        )}
                      >
                        {v.title}
                      </span>
                      <span className="block truncate text-sm text-[var(--muted-foreground)]">
                        {v.author}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </Page>
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
        <Status lib={lib} empty="ยังไม่มีคลิปสั้น วางลิงก์ youtube.com/shorts/… ได้เลย" />
      </Page>
    );
  const feed = items.flatMap((v, i) => {
    const promo = (i + 1) % 3 === 0 ? PROMOS[((i + 1) / 3 - 1) % PROMOS.length] : undefined;
    return promo ? [{ v }, { promo }] : [{ v }];
  });
  return (
    <div className="st-no-scrollbar mx-auto h-[calc(100dvh-8.5rem)] max-w-sm snap-y snap-mandatory overflow-y-auto px-4 py-3">
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
