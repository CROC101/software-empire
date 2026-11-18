import { HubSwitcher, cn } from "@empire/ui";
import { subsystems } from "@empire/core/subsystems";
import { Clapperboard, Grid3x3, Music2, Plus, Search, Smartphone, Tv, X } from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router";
import { env } from "@/lib/env";
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
  const q = useSearchParams()[0].get("q");
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
          <Link
            to="/add"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-[var(--em-blue-600)] px-3 text-sm font-semibold text-[var(--em-ink-0)] hover:bg-[var(--em-blue-500)]"
          >
            <Plus className="size-4" aria-hidden />
            <span className="sr-only sm:not-sr-only">เพิ่มลิงก์</span>
          </Link>
        </div>
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
                to={q ? `${to}?${new URLSearchParams({ q })}` : to}
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
