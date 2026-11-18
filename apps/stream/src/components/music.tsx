import { cn } from "@empire/ui";
import { Pause, Play, Shuffle } from "lucide-react";
import { useMemo } from "react";
import { type Video } from "@/lib/api";
import { shuffle } from "@/lib/search";
import { thumb } from "@/lib/youtube";
import { More, Status, useLibrary } from "./modes";
import { usePlayer } from "./player";

const hover = "hover:bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]";
const date = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });

/** Channels in the list, each with its tracks, in the order they first appear. */
export function byChannel(list: Video[]) {
  const map = new Map<string, Video[]>();
  for (const v of list) map.set(v.author, [...(map.get(v.author) ?? []), v]);
  return [...map].map(([name, tracks]) => ({ name, tracks }));
}

/** Music in a streaming-app layout: cover hero, play / shuffle, channels, a track table. */
export function MusicPage() {
  const lib = useLibrary("music");
  const p = usePlayer();
  const list = lib.all;
  const channels = useMemo(() => byChannel(list).slice(0, 12), [list]);
  const here = !!p.current && list.some((v) => v.youtube_id === p.current?.youtube_id);

  const playAll = () => {
    if (here) {
      if (p.playing) p.pause();
      else p.resume();
      return;
    }
    const [first] = list;
    if (first) p.play(first, list);
  };
  const playMixed = () => {
    const mixed = shuffle(list);
    const [first] = mixed;
    if (first) p.play(first, mixed);
  };

  return (
    <div className="pb-6">
      {/* hero: the water gradient fades into the page, a mosaic of the first covers */}
      <header className="bg-[linear-gradient(180deg,color-mix(in_oklab,var(--em-blue-500)_45%,transparent),transparent)]">
        <div className="mx-auto flex w-full max-w-6xl items-end gap-4 px-4 pb-6 pt-8 sm:gap-6">
          <Mosaic list={list} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[var(--foreground)]">
              {lib.query ? "ผลค้นหา" : "เพลย์ลิสต์"}
            </p>
            <h1 className="truncate text-4xl font-black text-[var(--foreground)] sm:text-6xl lg:text-7xl">
              {lib.query ? `“${lib.query}”` : "เพลง"}
            </h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              <span className="font-bold text-[var(--foreground)]">crocwork stream</span>
              {list.length > 0 && ` · ${list.length} เพลง`} · ย่อเครื่องเล่นแล้วฟังต่อได้
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4">
        {list.length === 0 ? (
          <Status lib={lib} empty="ยังไม่มีเพลง" />
        ) : (
          <>
            <div className="flex items-center gap-5 py-4">
              <button
                type="button"
                onClick={playAll}
                aria-label={here && p.playing ? "หยุด" : "เล่นทั้งหมด"}
                className="grid size-14 place-items-center rounded-full bg-[var(--em-blue-500)] text-[var(--em-ink-0)] shadow-lg transition-transform hover:scale-105 hover:bg-[var(--em-blue-600)]"
              >
                {here && p.playing ? (
                  <Pause className="size-6 fill-current" aria-hidden />
                ) : (
                  <Play className="ml-0.5 size-6 fill-current" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={playMixed}
                aria-label="สุ่มเล่น"
                className="grid size-11 place-items-center rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <Shuffle className="size-7" aria-hidden />
              </button>
            </div>

            {channels.length > 1 && (
              <section aria-label="ช่อง" className="mb-6">
                <h2 className="mb-2 text-2xl font-black text-[var(--foreground)]">
                  ช่องในรายการนี้
                </h2>
                <ul className="st-no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-2">
                  {channels.map((c) => (
                    <li key={c.name} className="w-36 shrink-0 sm:w-44">
                      <ChannelCard name={c.name} tracks={c.tracks} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <Tracks list={list} />
            <More lib={lib} />
          </>
        )}
      </div>
    </div>
  );
}

function Mosaic({ list }: { list: Video[] }) {
  const covers = list.slice(0, 4);
  return (
    <div
      aria-hidden
      className="grid size-28 shrink-0 grid-cols-2 overflow-hidden rounded-md bg-[var(--muted)] shadow-2xl sm:size-48 lg:size-56"
    >
      {covers.length === 4 ? (
        covers.map((v) => (
          <img
            key={v.youtube_id}
            src={thumb(v.youtube_id)}
            alt=""
            className="size-full object-cover"
          />
        ))
      ) : covers[0] ? (
        <img
          src={thumb(covers[0].youtube_id)}
          alt=""
          className="col-span-2 row-span-2 size-full object-cover"
        />
      ) : null}
    </div>
  );
}

/** A channel: round cover, a play button that rises on hover, plays only that channel. */
function ChannelCard({ name, tracks }: { name: string; tracks: Video[] }) {
  const { play } = usePlayer();
  const [first] = tracks;
  if (!first) return null;
  return (
    <button
      type="button"
      onClick={() => play(first, tracks)}
      className={cn("group grid w-full gap-2 rounded-lg p-2 text-left", hover)}
    >
      <span className="relative block">
        <img
          src={thumb(first.youtube_id)}
          alt=""
          loading="lazy"
          className="aspect-square w-full rounded-full object-cover shadow-lg"
        />
        <span
          aria-hidden
          className="absolute bottom-1 right-1 grid size-11 translate-y-2 place-items-center rounded-full bg-[var(--em-blue-500)] text-[var(--em-ink-0)] opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
        >
          <Play className="ml-0.5 size-5 fill-current" />
        </span>
      </span>
      <span className="truncate font-semibold text-[var(--foreground)]">{name}</span>
      <span className="text-sm text-[var(--muted-foreground)]">{tracks.length} เพลง</span>
    </button>
  );
}

const cols =
  "grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-4 md:grid-cols-[2rem_minmax(0,4fr)_minmax(0,2fr)] lg:grid-cols-[2rem_minmax(0,4fr)_minmax(0,2fr)_8rem]";

/** The track table: number (play on hover, bars while playing), cover + title, channel, date. */
function Tracks({ list }: { list: Video[] }) {
  const p = usePlayer();
  return (
    <section aria-label="รายการเพลง">
      <div
        aria-hidden
        className={cn(
          cols,
          "border-b border-[color-mix(in_oklab,var(--foreground)_12%,transparent)] px-3 pb-2 text-sm text-[var(--muted-foreground)]",
        )}
      >
        <span className="text-right">#</span>
        <span>ชื่อเพลง</span>
        <span className="hidden md:block">ช่อง</span>
        <span className="hidden lg:block">วันที่เพิ่ม</span>
      </div>
      <ol className="mt-2 grid">
        {list.map((v, i) => {
          const on = p.current?.youtube_id === v.youtube_id;
          return (
            <li key={v.youtube_id}>
              <button
                type="button"
                onClick={() => (on ? (p.playing ? p.pause() : p.resume()) : p.play(v, list))}
                aria-current={on || undefined}
                className={cn(cols, "group w-full rounded-md px-3 py-2 text-left", hover)}
              >
                <span className="grid justify-items-end text-sm tabular-nums text-[var(--muted-foreground)]">
                  {on && p.playing ? (
                    <Bars />
                  ) : (
                    <>
                      <span className="col-start-1 row-start-1 group-hover:invisible">{i + 1}</span>
                      <Play
                        aria-hidden
                        className="invisible col-start-1 row-start-1 size-4 fill-current text-[var(--foreground)] group-hover:visible"
                      />
                    </>
                  )}
                </span>
                <span className="flex min-w-0 items-center gap-3">
                  <img
                    src={thumb(v.youtube_id)}
                    alt=""
                    loading="lazy"
                    className="size-10 shrink-0 rounded object-cover"
                  />
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block truncate font-semibold",
                        on ? "text-[var(--primary)]" : "text-[var(--foreground)]",
                      )}
                    >
                      {v.title}
                    </span>
                    <span className="block truncate text-sm text-[var(--muted-foreground)] md:hidden">
                      {v.author}
                    </span>
                  </span>
                </span>
                <span className="hidden truncate text-sm text-[var(--muted-foreground)] md:block">
                  {v.author}
                </span>
                <span className="hidden text-sm text-[var(--muted-foreground)] lg:block">
                  {date(v.created_at)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** "Now playing" bars; still under reduced motion (styles.css). */
function Bars() {
  return (
    <span aria-label="กำลังเล่น" className="vt-live flex h-4 items-end gap-0.5">
      {[0, 1, 2].map((n) => (
        <span
          key={n}
          className="st-bar h-full w-[3px] origin-bottom bg-[var(--primary)]"
          style={{ animationDelay: `${n * -0.3}s` }}
        />
      ))}
    </span>
  );
}
