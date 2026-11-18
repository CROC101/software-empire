import { subsystems } from "@empire/core/subsystems";
import { cn } from "@empire/ui";
import { ArrowUpRight, Play, Plus, Shuffle, Trash2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { removeItem, type Kind, type Video } from "@/lib/api";
import { allVideos, useData } from "@/lib/data";
import { env } from "@/lib/env";
import { thumb } from "@/lib/youtube";
import { resumeAt, usePlayer } from "./player";

/** Every video of one kind (own first), plus the ones the viewer stopped part way through. */
function useLibrary(kind?: Kind) {
  const { featured, mine, progress, loaded, error, refresh } = useData();
  return useMemo(() => {
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
    };
  }, [featured, mine, progress, loaded, error, refresh, kind]);
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
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--em-blue-300)]">
        {eyebrow}
      </p>
      <h1 className="mb-4 text-3xl font-black text-[var(--em-ink-0)]">{title}</h1>
      {children}
    </div>
  );
}

function Status({ lib, empty }: { lib: ReturnType<typeof useLibrary>; empty: string }) {
  if (!lib.loaded) return <p className="py-10 text-center text-[var(--em-ink-300)]">กำลังโหลด…</p>;
  if (lib.error)
    return (
      <p role="alert" className="py-10 text-center text-[var(--em-ink-300)]">
        {lib.error}{" "}
        <button type="button" onClick={lib.refresh} className="text-[var(--em-blue-300)] underline">
          ลองใหม่
        </button>
      </p>
    );
  return (
    <div className="grid place-items-center gap-3 rounded-xl border border-dashed border-[color-mix(in_oklab,var(--em-ink-0)_18%,transparent)] px-4 py-12 text-center">
      <p className="text-[var(--em-ink-300)]">{empty}</p>
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
function Seen({ id }: { id: string }) {
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
      <span className="relative block aspect-video overflow-hidden rounded-lg bg-[var(--em-ink-900)]">
        <img
          src={thumb(v.youtube_id)}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <Seen id={v.youtube_id} />
      </span>
      <span className="min-w-0">
        <span className="line-clamp-2 text-sm font-semibold text-[var(--em-ink-0)]">{v.title}</span>
        <span className="block truncate text-xs text-[var(--em-ink-300)]">{v.author}</span>
      </span>
    </button>
  );
}

function Shelf({ title, items }: { title: string; items: Video[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-6">
      <h2 className="mb-2 font-heading text-lg font-bold text-[var(--em-ink-0)]">{title}</h2>
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

/** Netflix style: one big hero, then rows. */
export function MoviesPage() {
  const lib = useLibrary("movie");
  const { play } = usePlayer();
  const hero = lib.resume[0] ?? lib.featured[0] ?? lib.mine[0];
  if (!hero)
    return (
      <Page eyebrow="Movies" title="หนัง">
        <Status
          lib={lib}
          empty="ยังไม่มีหนัง ลองวางลิงก์หนังเต็มเรื่องที่เจ้าของเปิดให้ดูฟรีบน YouTube"
        />
      </Page>
    );
  const resuming = lib.resume.includes(hero);
  return (
    <div className="mx-auto w-full max-w-6xl">
      <section className="relative isolate min-h-[56vw] overflow-hidden sm:min-h-[28rem]">
        <img
          src={thumb(hero.youtube_id, "max")}
          onError={(e) => {
            // not every video has a full-size cover
            e.currentTarget.src = thumb(hero.youtube_id);
          }}
          alt=""
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div aria-hidden className="st-hero-fade absolute inset-0 -z-10" />
        <div className="flex min-h-[inherit] flex-col justify-end gap-3 px-4 pb-6 sm:max-w-xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--em-blue-300)]">
            Movies
          </p>
          <h1 className="text-3xl font-black text-[var(--em-ink-0)] sm:text-4xl">{hero.title}</h1>
          <p className="text-sm text-[var(--em-ink-200)]">{hero.author}</p>
          <button
            type="button"
            onClick={() => play(hero, lib.all)}
            className="inline-flex min-h-12 w-fit items-center gap-2 rounded-md bg-[var(--em-ink-0)] px-6 font-bold text-[var(--em-ink-975)] hover:bg-[var(--em-ink-100)]"
          >
            <Play className="size-5 fill-current" aria-hidden />
            {resuming ? "ดูต่อ" : "เล่น"}
          </button>
        </div>
      </section>
      <div className="px-4 pt-2">
        <Shelf title="ดูต่อ" items={lib.resume} />
        <Shelf title="แนะนำ" items={lib.featured} />
        <Shelf title="คลังของฉัน" items={lib.mine} />
      </div>
    </div>
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
              className="inline-flex min-h-12 items-center gap-2 rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_18%,transparent)] px-5 hover:bg-[color-mix(in_oklab,var(--em-ink-0)_8%,transparent)]"
            >
              <Shuffle className="size-4" aria-hidden /> สุ่ม
            </button>
          </div>
          <p className="mb-3 text-sm text-[var(--em-ink-300)]">
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
                    className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-[color-mix(in_oklab,var(--em-ink-0)_8%,transparent)]"
                  >
                    <span className="w-6 text-right text-sm tabular-nums text-[var(--em-ink-300)]">
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
                          on ? "text-[var(--em-blue-300)]" : "text-[var(--em-ink-0)]",
                        )}
                      >
                        {v.title}
                      </span>
                      <span className="block truncate text-sm text-[var(--em-ink-300)]">
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
      className="relative mb-3 block aspect-[9/16] max-h-full w-full snap-center overflow-hidden rounded-xl bg-[var(--em-ink-900)] text-left"
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

const SORTS = [
  { key: "new", label: "ล่าสุด" },
  { key: "name", label: "ชื่อ" },
  { key: "resume", label: "ดูค้าง" },
] as const;

/** A dense grid of everything, every kind, with sort tabs and a remove button on your own links. */
export function TubePage() {
  const lib = useLibrary();
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>("new");
  const [busy, setBusy] = useState<string | null>(null);
  const items = useMemo(() => {
    if (sort === "resume") return lib.resume;
    const list = [...lib.all];
    return sort === "name"
      ? list.sort((a, b) => a.title.localeCompare(b.title, "th"))
      : list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [lib.all, lib.resume, sort]);

  const remove = async (v: Video) => {
    if (!v.id) return;
    setBusy(v.id);
    try {
      await removeItem(v.id);
      lib.refresh();
    } catch (e) {
      console.error("ลบไม่สำเร็จ", e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Page eyebrow="Tube" title="ทั้งหมด">
      <div role="tablist" aria-label="เรียง" className="mb-4 flex gap-2">
        {SORTS.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={sort === s.key}
            onClick={() => setSort(s.key)}
            className={cn(
              "min-h-10 rounded-full px-4 text-sm font-semibold",
              sort === s.key
                ? "bg-[var(--em-ink-0)] text-[var(--em-ink-975)]"
                : "bg-[color-mix(in_oklab,var(--em-ink-0)_10%,transparent)] text-[var(--em-ink-100)]",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <Status lib={lib} empty={sort === "resume" ? "ยังไม่มีคลิปที่ดูค้าง" : "ยังไม่มีอะไรเลย"} />
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((v) => (
            <li key={v.youtube_id} className="relative">
              <VideoCard v={v} list={items} />
              {v.id && (
                <button
                  type="button"
                  disabled={busy === v.id}
                  onClick={() => void remove(v)}
                  aria-label={`ลบ ${v.title} ออกจากคลัง`}
                  className="absolute right-1 top-1 grid size-9 place-items-center rounded-md bg-[color-mix(in_oklab,var(--em-ink-975)_75%,transparent)] text-[var(--em-ink-0)] hover:bg-[var(--em-coral-500)] disabled:opacity-50"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
