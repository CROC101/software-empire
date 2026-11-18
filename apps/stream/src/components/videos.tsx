import { cn } from "@empire/ui";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { type Video } from "@/lib/api";
import { frame, thumb } from "@/lib/youtube";
import { More, Seen, Status, useLibrary } from "./modes";
import { byChannel } from "./music";
import { usePlayer } from "./player";

/** Topic tabs: each one is a YouTube search, so the grid fills with that topic. */
const TOPICS = [
  "เกม",
  "ตลก",
  "ข่าว",
  "กีฬา",
  "ทำอาหาร",
  "รีวิว",
  "ท่องเที่ยว",
  "เทคโนโลยี",
  "สารคดี",
  "การ์ตูน",
];

/** Which of YouTube's 3 storyboard frames sits under the pointer (1-3). */
export function frameAt(x: number, width: number) {
  if (!(width > 0)) return 1;
  return Math.min(3, Math.max(1, Math.floor((x / width) * 3) + 1));
}

/** The channels with the most clips in the list, most first (ties keep list order). */
export function topChannels(list: Video[], n = 10) {
  return byChannel(list)
    .sort((a, b) => b.tracks.length - a.tracks.length)
    .slice(0, n);
}

const line = "border-[color-mix(in_oklab,var(--foreground)_12%,transparent)]";

/** A dense video grid: topic tabs, channel tags, small square-cornered cards that scrub on hover. */
export function VideosPage() {
  const lib = useLibrary("video");
  const [params] = useSearchParams();
  const [tag, setTag] = useState<string | null>(null);
  const channels = useMemo(() => topChannels(lib.all), [lib.all]);
  // a tag from an older search no longer applies
  const active = channels.some((c) => c.name === tag) ? tag : null;
  const shown = active ? lib.all.filter((v) => v.author === active) : lib.all;

  const topic = (q: string) => {
    const next = new URLSearchParams(params);
    next.delete("page");
    if (q) next.set("q", q);
    else next.delete("q");
    const s = next.toString();
    return s ? `/videos?${s}` : "/videos";
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-2.5 pb-10 sm:px-4">
      <nav aria-label="หมวด" className={cn("-mx-2.5 mb-4 border-b sm:-mx-4", line)}>
        <ul className="st-no-scrollbar flex overflow-x-auto px-1">
          {["", ...TOPICS].map((t) => {
            const on = lib.query === t;
            return (
              <li key={t || "all"} className="shrink-0">
                <Link
                  to={topic(t)}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center border-b-2 px-4 text-sm font-bold whitespace-nowrap hover:text-[var(--primary)]",
                    on
                      ? "border-[var(--primary)] text-[var(--primary)]"
                      : "border-transparent text-[var(--foreground)]",
                  )}
                >
                  {t || "ทั้งหมด"}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-xl font-bold text-[var(--foreground)]">
          {lib.query ? `“${lib.query}”` : "วิดีโอ"}
        </h1>
        {shown.length > 0 && (
          <span aria-live="polite" className="text-sm text-[var(--muted-foreground)]">
            <span className="font-bold text-[var(--primary)]">{shown.length}</span> คลิป
          </span>
        )}
      </div>

      {channels.length > 1 && (
        <ul
          aria-label="ช่อง"
          className="st-no-scrollbar -mx-2.5 mb-5 flex gap-2 overflow-x-auto px-2.5 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {channels.map((c) => {
            const on = active === c.name;
            return (
              <li key={c.name} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTag(on ? null : c.name)}
                  className={cn(
                    "inline-flex min-h-9 max-w-56 items-center gap-1.5 rounded-full border px-3 text-sm font-bold",
                    on
                      ? "border-[var(--primary)] bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-[var(--foreground)]"
                      : cn(
                          line,
                          "text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]",
                        ),
                  )}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-xs font-normal text-[var(--muted-foreground)]">
                    {c.tracks.length}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!lib.query && !active && lib.resume.length > 0 && (
        <section aria-label="ดูต่อ" className="mb-6">
          <h2 className="mb-2 text-lg font-bold text-[var(--foreground)]">ดูต่อ</h2>
          <Grid items={lib.resume.slice(0, 5)} />
        </section>
      )}

      {shown.length ? <Grid items={shown} /> : <Status lib={lib} empty="ยังไม่มีวิดีโอ" />}
      {!active && <More lib={lib} />}
    </div>
  );
}

function Grid({ items }: { items: Video[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-2.5 gap-y-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((v) => (
        <li key={v.youtube_id} className="min-w-0">
          <Card v={v} list={items} />
        </li>
      ))}
    </ul>
  );
}

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });

/** Hovering with a mouse scrubs through YouTube's storyboard frames, with a bar for where you are. */
function Card({ v, list }: { v: Video; list: Video[] }) {
  const { play } = usePlayer();
  const [at, setAt] = useState(0);
  const [noFrames, setNoFrames] = useState(false);
  const src = at && !noFrames ? frame(v.youtube_id, at) : thumb(v.youtube_id);
  return (
    <button
      type="button"
      onClick={() => play(v, list)}
      className="group grid w-full gap-1.5 text-left"
    >
      <span
        className="relative block aspect-video overflow-hidden rounded-[3px] bg-[var(--muted)]"
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          setAt(frameAt(e.clientX - r.left, r.width));
        }}
        onPointerLeave={() => setAt(0)}
      >
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => at && setNoFrames(true)}
          className="size-full object-cover"
        />
        <Seen id={v.youtube_id} />
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-[var(--primary)] transition-transform duration-150"
          style={{ transform: `scaleX(${at / 3})` }}
        />
      </span>
      <span className="min-w-0">
        <span className="line-clamp-2 text-sm font-bold leading-snug text-[var(--foreground)] group-hover:text-[var(--primary)]">
          {v.title}
        </span>
        <span className="block truncate text-xs text-[var(--muted-foreground)]">
          {v.author} · {date(v.created_at)}
        </span>
      </span>
    </button>
  );
}
