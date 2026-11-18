import { HubSwitcher, cn } from "@empire/ui";
import { subsystems } from "@empire/core/subsystems";
import {
  Clapperboard,
  Grid3x3,
  Music2,
  Search,
  SlidersHorizontal,
  Smartphone,
  Tv,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router";
import { env } from "@/lib/env";
import { filters, type Filters } from "@/lib/search";
import { PlayerProvider, usePlayer } from "./player";

/** The five ways to watch the same links: one tab each. */
const MODES = [
  { to: "/videos", label: "วิดีโอ", icon: Tv },
  { to: "/movies", label: "หนัง", icon: Clapperboard },
  { to: "/music", label: "เพลง", icon: Music2 },
  { to: "/shorts", label: "Shorts", icon: Smartphone },
  { to: "/tube", label: "Tube", icon: Grid3x3 },
];

export function Shell() {
  return (
    <PlayerProvider>
      <Frame />
    </PlayerProvider>
  );
}

function Frame() {
  const { current } = usePlayer();
  // switching tabs keeps the search: the same results, watched in another style
  const [params] = useSearchParams();
  const q = params.get("q");
  const keep = new URLSearchParams([...params].filter(([name]) => KEEP.has(name)));
  return (
    <div className="flex min-h-dvh flex-col text-[var(--foreground)]">
      <div aria-hidden className="st-sky" />
      <header className="vt-top sticky top-0 z-30 border-b border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] bg-[color-mix(in_oklab,var(--background)_88%,transparent)]">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-2">
          <HubSwitcher
            hubUrl={env.hubUrl}
            apps={subsystems}
            current="stream"
            cookieDomain={import.meta.env.VITE_COOKIE_DOMAIN}
            iconOnly
            className="size-11 justify-center rounded-md text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)]"
          />
          <Link
            to="/videos"
            className="hidden font-heading text-lg font-black text-[var(--foreground)] sm:block"
          >
            crocwork <span className="text-[var(--primary)]">stream</span>
          </Link>
          <SearchBox />
        </div>
        {q && <SearchFilters />}
      </header>
      {/* room below for the tab bar, and for the mini player when one is open */}
      <main
        id="content"
        className={cn(
          "flex-1 pb-20",
          current && "pb-[calc(5rem+min(22.25rem,100vw-1rem)*0.5625+3.5rem)]",
        )}
      >
        <Outlet />
      </main>
      <nav
        aria-label="โหมด"
        className="vt-top fixed inset-x-0 bottom-0 z-30 border-t border-[color-mix(in_oklab,var(--foreground)_12%,transparent)] bg-[color-mix(in_oklab,var(--background)_94%,transparent)] pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {MODES.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={q ? `${to}?${keep}` : to}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs",
                    isActive ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]",
                  )
                }
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/** What a tab switch carries over: the search and its filters. */
const KEEP = new Set(["q", "order", "when", "length"]);

const GROUPS: {
  name: keyof Filters;
  title: string;
  options: [Filters[keyof Filters], string][];
}[] = [
  {
    name: "when",
    title: "วันที่อัปโหลด",
    options: [
      ["hour", "ชั่วโมงที่ผ่านมา"],
      ["today", "วันนี้"],
      ["week", "สัปดาห์นี้"],
      ["month", "เดือนนี้"],
      ["year", "ปีนี้"],
    ],
  },
  {
    name: "length",
    title: "ระยะเวลา",
    options: [
      ["short", "ต่ำกว่า 4 นาที"],
      ["medium", "4 - 20 นาที"],
      ["long", "มากกว่า 20 นาที"],
    ],
  },
  {
    name: "order",
    title: "จัดเรียงตาม",
    options: [
      ["relevance", "ความเกี่ยวข้อง (สุ่มลำดับ)"],
      ["date", "วันที่อัปโหลด"],
      ["viewCount", "ยอดดู"],
      ["rating", "คะแนน"],
    ],
  },
];
// movies are always long and shorts always short, so length means nothing there
const FIXED_LENGTH = new Set(["/movies", "/shorts"]);

/** YouTube's search filters, kept in the URL so back, share and tab switches keep them. */
function SearchFilters() {
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const now = filters.parse(Object.fromEntries(params));
  const on = (Object.keys(now) as (keyof Filters)[]).filter(
    (name) => now[name] !== filters.parse({})[name],
  ).length;
  const link = (name: keyof Filters, value: string) => {
    const next = new URLSearchParams(params);
    // picking the active option again (or the default) clears it, like YouTube
    if (now[name] === value || filters.parse({})[name] === value) next.delete(name);
    else next.set(name, value);
    return `${pathname}?${next}`;
  };
  const groups = GROUPS.filter((g) => g.name !== "length" || !FIXED_LENGTH.has(pathname));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="search-filters"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-9 items-center gap-2 rounded-md px-2 text-sm font-semibold hover:bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)]"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        ตัวกรอง
        {on > 0 && (
          <span className="grid size-5 place-items-center rounded-full bg-[var(--primary)] text-xs text-[var(--em-ink-0)]">
            {on}
          </span>
        )}
      </button>
      <div
        id="search-filters"
        hidden={!open}
        className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-x-4 gap-y-2 border-t border-[color-mix(in_oklab,var(--foreground)_10%,transparent)] pt-3"
      >
        {groups.map((g) => (
          <section key={g.name} aria-label={g.title} className="min-w-0">
            <h2 className="mb-1 border-b border-[color-mix(in_oklab,var(--foreground)_10%,transparent)] pb-2 text-xs font-bold uppercase text-[var(--muted-foreground)]">
              {g.title}
            </h2>
            <ul className="grid">
              {g.options.map(([value, label]) => (
                <li key={value}>
                  <Link
                    to={link(g.name, value)}
                    onClick={() => setOpen(false)}
                    aria-current={now[g.name] === value ? "true" : undefined}
                    className={cn(
                      "flex min-h-9 items-center gap-1 text-sm hover:text-[var(--foreground)]",
                      now[g.name] === value
                        ? "font-bold text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)]",
                    )}
                  >
                    {label}
                    {now[g.name] === value && g.name !== "order" && (
                      <X className="size-3.5 shrink-0" aria-label="ล้าง" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

/** Searches YouTube in the mode on screen (pages that are not a mode search in วิดีโอ). */
function SearchBox() {
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const q = params.get("q") ?? "";
  const mode = MODES.some((m) => m.to === pathname) ? pathname : "/videos";

  return (
    <form
      role="search"
      // a new key per query resets the field when the URL changes (back button, clear)
      key={q}
      onSubmit={(e) => {
        e.preventDefault();
        const field = new FormData(e.currentTarget).get("q");
        const next = typeof field === "string" ? field.trim() : "";
        void navigate(next ? `${mode}?${new URLSearchParams({ q: next })}` : mode);
      }}
      className="relative mx-auto flex min-w-0 flex-1 sm:max-w-md"
    >
      <label htmlFor="search" className="sr-only">
        ค้นหาใน YouTube
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
        aria-hidden
      />
      <input
        id="search"
        name="q"
        type="search"
        defaultValue={q}
        maxLength={100}
        enterKeyHint="search"
        placeholder="ค้นหาใน YouTube"
        className="min-h-11 w-full min-w-0 rounded-md border border-[color-mix(in_oklab,var(--foreground)_14%,transparent)] bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] pl-9 pr-10 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {q && (
        <Link
          to={mode}
          aria-label="ล้างการค้นหา"
          className="absolute right-0 top-0 grid size-11 place-items-center text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <X className="size-4" aria-hidden />
        </Link>
      )}
    </form>
  );
}
