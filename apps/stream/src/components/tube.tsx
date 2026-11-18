import { cn } from "@empire/ui";
import {
  Clapperboard,
  History,
  Home,
  Music2,
  Plus,
  Smartphone,
  Trash2,
  Tv,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { removeItem, type Kind, type Video } from "@/lib/api";
import { useData } from "@/lib/data";
import { searchVideos, type Hit } from "@/lib/search";
import { clock, timeAgo } from "@/lib/time";
import { thumb } from "@/lib/youtube";
import { Seen, Status, useLibrary } from "./modes";
import { usePlayer } from "./player";

/*
 * Tube = the YouTube home layout (after the owner's youtubecraft): guide on the left, sticky
 * chips, a 1-4 column grid by container width, and a Shorts shelf. Colours are crocwork tokens.
 */

const KIND_LABEL: Record<Kind, string> = {
  video: "วิดีโอ",
  movie: "หนัง",
  music: "เพลง",
  short: "Shorts",
};
// chips that open a live YouTube search (answers are cached by the Worker for 6 h)
const SEARCHES = ["เพลงฮิต", "เกม", "ข่าว", "สอนเขียนโค้ด", "ทำอาหาร"];

const raised = "bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)]";
const hover = "hover:bg-[color-mix(in_oklab,var(--foreground)_18%,transparent)]";
const muted = "text-[var(--muted-foreground)]";

/** YouTube's own picks fill the home after the library, so a new viewer never sees it empty. */
function useFeed(on: boolean) {
  const [feed, setFeed] = useState<{ videos: Hit[]; shorts: Hit[] }>({ videos: [], shorts: [] });
  useEffect(() => {
    if (!on) return;
    const stop = new AbortController();
    // search off or quota spent: the home shows the library alone
    searchVideos("มาแรง วันนี้", "video", stop.signal).then(
      (videos) => setFeed((f) => ({ ...f, videos })),
      () => undefined,
    );
    searchVideos("shorts ไทย", "short", stop.signal).then(
      (shorts) => setFeed((f) => ({ ...f, shorts })),
      () => undefined,
    );
    return () => stop.abort();
  }, [on]);
  return feed;
}

const merge = (own: Video[], extra: Video[]) => {
  const seen = new Set(own.map((v) => v.youtube_id));
  return [...own, ...extra.filter((v) => !seen.has(v.youtube_id))];
};

type Filter =
  { by: "all" } | { by: "kind"; kind: Kind } | { by: "resume" } | { by: "author"; name: string };

export function TubePage() {
  const lib = useLibrary();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>({ by: "all" });
  const feed = useFeed(!lib.query);

  const channels = useMemo(() => {
    const count = new Map<string, number>();
    for (const v of lib.all) count.set(v.author, (count.get(v.author) ?? 0) + 1);
    return [...count.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name]) => name);
  }, [lib.all]);

  const items = useMemo(() => {
    const newest = [...lib.all].sort((a, b) => b.created_at.localeCompare(a.created_at));
    switch (filter.by) {
      case "kind":
        return newest.filter((v) => v.kind === filter.kind);
      case "resume":
        return lib.resume;
      case "author":
        return newest.filter((v) => v.author === filter.name);
      default:
        // shorts get their own shelf below, like the YouTube home page
        return lib.query
          ? newest
          : merge(
              newest.filter((v) => v.kind !== "short"),
              feed.videos,
            );
    }
  }, [lib.all, lib.resume, lib.query, filter, feed.videos]);
  const shorts = useMemo(
    () =>
      filter.by === "all" && !lib.query
        ? merge(
            lib.all.filter((v) => v.kind === "short"),
            feed.shorts,
          )
        : [],
    [lib.all, lib.query, filter.by, feed.shorts],
  );

  const pick = (next: Filter) => {
    setFilter(next);
    if (lib.query) void navigate("/tube");
  };
  const active = (f: Filter) => JSON.stringify(f) === JSON.stringify(filter) && !lib.query;
  const fadeKey = lib.query || JSON.stringify(filter);

  return (
    // YouTube's page is flat: cover the shared night sky
    <div className="flex min-h-[calc(100dvh-60px)] bg-[var(--background)]">
      <Guide channels={channels} filter={filter} onPick={pick} />
      <div className="min-w-0 flex-1">
        <div className="vt-top sticky top-[60px] z-20 bg-[color-mix(in_oklab,var(--background)_95%,transparent)]">
          <div
            role="toolbar"
            aria-label="ตัวกรอง"
            className="st-no-scrollbar flex gap-3 overflow-x-auto px-4 py-3 sm:px-6"
          >
            <Chip active={active({ by: "all" })} onClick={() => pick({ by: "all" })}>
              ทั้งหมด
            </Chip>
            {(Object.keys(KIND_LABEL) as Kind[]).map((kind) => (
              <Chip
                key={kind}
                active={active({ by: "kind", kind })}
                onClick={() => pick({ by: "kind", kind })}
              >
                {KIND_LABEL[kind]}
              </Chip>
            ))}
            <Chip active={active({ by: "resume" })} onClick={() => pick({ by: "resume" })}>
              ดูค้าง
            </Chip>
            {filter.by === "author" && !lib.query && (
              <Chip active onClick={() => pick({ by: "all" })}>
                {filter.name} <X className="ml-1 inline size-3.5" aria-label="เลิกกรองช่อง" />
              </Chip>
            )}
            {SEARCHES.map((q) => (
              <Link
                key={q}
                to={`/tube?${new URLSearchParams({ q })}`}
                aria-current={lib.query === q ? "true" : undefined}
                onClick={() => setFilter({ by: "all" })}
                className={chipClass(lib.query === q)}
              >
                {q}
              </Link>
            ))}
            {lib.query && !SEARCHES.includes(lib.query) && (
              <Link to="/tube" aria-label="ล้างการค้นหา" className={chipClass(true)}>
                “{lib.query}” <X className="ml-1 inline size-3.5" aria-hidden />
              </Link>
            )}
          </div>
        </div>

        <div key={fadeKey} className="st-rise @container">
          {items.length === 0 ? (
            <div className="px-4 pt-6 sm:px-6">
              <Status
                lib={lib}
                empty={filter.by === "resume" ? "ยังไม่มีคลิปที่ดูค้าง" : "ยังไม่มีอะไรเลย"}
              />
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-x-4 gap-y-10 px-4 pt-3 pb-10 sm:px-6 @[600px]:grid-cols-2 @[900px]:grid-cols-3 @[1240px]:grid-cols-4">
              {items.map((v) => (
                <li key={v.youtube_id} className="min-w-0">
                  <Card v={v} list={items} onRemoved={lib.refresh} />
                </li>
              ))}
            </ul>
          )}
          <ShortsShelf items={shorts} />
        </div>
      </div>
    </div>
  );
}

function chipClass(on: boolean) {
  return cn(
    "inline-flex h-8 shrink-0 items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors",
    on
      ? "bg-[var(--foreground)] text-[var(--background)]"
      : cn(raised, hover, "text-[var(--foreground)]"),
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={chipClass(active)}>
      {children}
    </button>
  );
}

/** The left guide: a 72 px rail on tablets, the full 240 px list on wide screens. */
function Guide({
  channels,
  filter,
  onPick,
}: {
  channels: string[];
  filter: Filter;
  onPick: (f: Filter) => void;
}) {
  const links = [
    { to: "/tube", label: "หน้าแรก", icon: Home, end: true },
    { to: "/shorts", label: "Shorts", icon: Zap },
    { to: "/videos", label: "วิดีโอ", icon: Tv },
    { to: "/movies", label: "หนัง", icon: Clapperboard },
    { to: "/music", label: "เพลง", icon: Music2 },
  ];
  const row =
    "flex h-[74px] flex-col items-center justify-center gap-1.5 rounded-[10px] px-1 text-[10px] xl:mx-3 xl:h-10 xl:flex-row xl:justify-start xl:gap-6 xl:px-3 xl:text-sm";
  return (
    <aside
      aria-label="เมนู Tube"
      className="st-no-scrollbar sticky top-[60px] hidden h-[calc(100dvh-60px-4rem)] w-[72px] shrink-0 overflow-y-auto px-1 pt-1 pb-6 md:block xl:w-[240px] xl:px-0 xl:pt-3"
    >
      <nav>
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(row, hover, isActive && cn(raised, "font-medium"), !isActive && "xl:font-normal")
            }
          >
            <Icon className="size-6 shrink-0" aria-hidden />
            <span className="max-w-full truncate">{label}</span>
          </NavLink>
        ))}
        <hr className="my-3 hidden border-[color-mix(in_oklab,var(--foreground)_10%,transparent)] xl:block" />
        <button
          type="button"
          onClick={() => onPick({ by: "resume" })}
          className={cn(row, hover, "w-full", filter.by === "resume" && raised)}
        >
          <History className="size-6 shrink-0" aria-hidden />
          <span className="max-w-full truncate">ดูค้าง</span>
        </button>
        <Link to="/add" className={cn(row, hover)}>
          <Plus className="size-6 shrink-0" aria-hidden />
          <span className="max-w-full truncate">เพิ่มลิงก์</span>
        </Link>
        {channels.length > 0 && (
          <div className="hidden xl:block">
            <hr className="my-3 border-[color-mix(in_oklab,var(--foreground)_10%,transparent)]" />
            <h3 className="px-6 pt-1.5 pb-1 text-base font-medium">ช่อง</h3>
            {channels.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onPick({ by: "author", name })}
                className={cn(
                  row,
                  hover,
                  "w-[216px]",
                  filter.by === "author" && filter.name === name && raised,
                )}
              >
                <Avatar name={name} size={24} />
                <span className="truncate">{name}</span>
              </button>
            ))}
          </div>
        )}
        <p
          className={cn(
            "hidden px-6 pt-4 text-xs leading-[18px] xl:block",
            "text-[var(--muted-foreground)]",
          )}
        >
          เล่นผ่านเครื่องเล่นทางการของ YouTube · ไม่ตัดโฆษณา ไม่ดาวน์โหลดคลิป
        </p>
      </nav>
    </aside>
  );
}

const graphemes = new Intl.Segmenter("th", { granularity: "grapheme" });
/** First visible letter, kept whole (Thai vowels and tone marks stay on their consonant). */
export const initial = (name: string) =>
  graphemes.segment(name.trim())[Symbol.iterator]().next().value?.segment.toUpperCase() ?? "?";

const AVATARS = [
  ["--em-blue-500", "--em-sky-400"],
  ["--em-violet-500", "--em-fuchsia-400"],
  ["--em-teal-600", "--em-sky-500"],
  ["--em-coral-500", "--em-gold-500"],
  ["--em-violet-600", "--em-blue-500"],
] as const;

/** A channel's first letter on a gradient picked from its name (we have no channel pictures). */
function Avatar({ name, size }: { name: string; size: number }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const [a, b] = AVATARS[Math.abs(h) % AVATARS.length] ?? AVATARS[0];
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-medium text-[var(--em-ink-0)] select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg, var(${a}), var(${b}))`,
      }}
    >
      {initial(name)}
    </span>
  );
}

function Card({ v, list, onRemoved }: { v: Video; list: Video[]; onRemoved: () => void }) {
  const { play } = usePlayer();
  const seen = useData().progress.get(v.youtube_id);
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    if (!v.id) return;
    setBusy(true);
    try {
      await removeItem(v.id);
      onRemoved();
    } catch (e) {
      console.error("ลบไม่สำเร็จ", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="group min-w-0">
      {/* the title below is the labelled button; the picture is a second, mouse-only target */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={() => play(v, list)}
        className="block w-full"
      >
        <span className="relative block aspect-video overflow-hidden rounded-[12px] bg-[var(--muted)] group-hover:rounded-none">
          <img src={thumb(v.youtube_id)} alt="" loading="lazy" className="size-full object-cover" />
          {seen && seen.duration > 0 && (
            <span className="absolute right-1.5 bottom-1.5 rounded bg-[color-mix(in_oklab,var(--em-ink-975)_80%,transparent)] px-1 py-px text-xs font-medium text-[var(--em-ink-0)] tabular-nums">
              {clock(seen.duration)}
            </span>
          )}
          <Seen id={v.youtube_id} />
        </span>
      </button>
      <div className="mt-3 flex gap-3">
        <Avatar name={v.author} size={36} />
        <button type="button" onClick={() => play(v, list)} className="min-w-0 flex-1 text-left">
          <span className="line-clamp-2 text-base leading-[22px] font-medium text-[var(--foreground)]">
            {v.title}
          </span>
          <span className={cn("mt-1 block truncate text-sm", muted)}>{v.author}</span>
          <span className={cn("block text-sm tabular-nums", muted)}>{timeAgo(v.created_at)}</span>
        </button>
        {v.id && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void remove()}
            aria-label={`ลบ ${v.title} ออกจากคลัง`}
            className={cn(
              "-mr-2 grid size-9 shrink-0 place-items-center rounded-full disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100",
              hover,
            )}
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </article>
  );
}

function ShortsShelf({ items }: { items: Video[] }) {
  const { play } = usePlayer();
  if (items.length === 0) return null;
  return (
    <section className="border-t border-[color-mix(in_oklab,var(--foreground)_10%,transparent)] px-4 pt-6 pb-16 sm:px-6">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[var(--foreground)]">
        <Zap className="size-6 fill-[var(--em-blue-500)] text-[var(--em-blue-500)]" aria-hidden />
        Shorts
      </h2>
      <ul className="st-no-scrollbar flex gap-3 overflow-x-auto">
        {items.map((v) => (
          <li key={v.youtube_id} className="w-[180px] shrink-0 sm:w-[210px]">
            <button type="button" onClick={() => play(v, items)} className="block w-full text-left">
              <span className="relative block aspect-[9/16] overflow-hidden rounded-[12px] bg-[var(--muted)]">
                <img
                  src={thumb(v.youtube_id)}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
                <Smartphone
                  className="absolute top-2 right-2 size-4 text-[var(--em-ink-0)]"
                  aria-hidden
                />
              </span>
              <span className="mt-2 line-clamp-2 text-base font-medium text-[var(--foreground)]">
                {v.title}
              </span>
              <span className={cn("block truncate text-sm", muted)}>{v.author}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
