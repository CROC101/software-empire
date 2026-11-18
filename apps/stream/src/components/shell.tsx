import { HubSwitcher, cn } from "@empire/ui";
import { subsystems } from "@empire/core/subsystems";
import { Clapperboard, Grid3x3, Music2, Plus, Smartphone, Tv } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router";
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
  return (
    <div className="flex min-h-dvh flex-col text-[var(--em-ink-50)]">
      <div aria-hidden className="st-sky" />
      <header className="vt-top sticky top-0 z-30 border-b border-[color-mix(in_oklab,var(--em-ink-0)_8%,transparent)] bg-[color-mix(in_oklab,var(--em-ink-975)_88%,transparent)]">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-2">
          <HubSwitcher
            hubUrl={env.hubUrl}
            apps={subsystems}
            current="stream"
            cookieDomain={import.meta.env.VITE_COOKIE_DOMAIN}
            iconOnly
            className="size-11 justify-center rounded-md text-[var(--em-ink-0)] hover:bg-[color-mix(in_oklab,var(--em-ink-0)_10%,transparent)]"
          />
          <Link
            to="/videos"
            className="mr-auto font-heading text-lg font-black text-[var(--em-ink-0)]"
          >
            crocwork <span className="text-[var(--em-blue-400)]">stream</span>
          </Link>
          <Link
            to="/add"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-[var(--em-blue-600)] px-3 text-sm font-semibold text-[var(--em-ink-0)] hover:bg-[var(--em-blue-500)]"
          >
            <Plus className="size-4" aria-hidden />
            เพิ่มลิงก์
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
        className="vt-top fixed inset-x-0 bottom-0 z-30 border-t border-[color-mix(in_oklab,var(--em-ink-0)_12%,transparent)] bg-[color-mix(in_oklab,var(--em-ink-975)_94%,transparent)] pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {MODES.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs",
                    isActive ? "text-[var(--em-blue-300)]" : "text-[var(--em-ink-300)]",
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
