import { useId, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { Ambience, AmbienceButton } from "./ambience";
import { SunMoonThemeToggle } from "./sun-moon-theme-toggle";

export type HubApp = { slug: string; name: string; summary: string; accent: string };

/**
 * "Explore the hub" launcher every app carries: back to the portfolio hub, or jump to any
 * other app. Links go through the hub's /go/<slug>, so an app never needs the others' URLs.
 * Uses the native popover API — light-dismiss, Escape and focus return come from the browser.
 */
export function HubSwitcher({
  hubUrl,
  apps,
  current,
  className,
  iconOnly = false,
  ambience = true,
  cookieDomain,
  children,
}: {
  hubUrl: string;
  apps: readonly HubApp[];
  /** slug of the app rendering this, marked "คุณอยู่ที่นี่" */
  current?: string;
  /** trigger button class — each app styles it like its own nav */
  className?: string;
  /** render the shared sky layer (off for apps that draw their own scenes) */
  ambience?: boolean;
  /** for the theme toggle in the panel: the app's COOKIE_DOMAIN env, unset on localhost */
  cookieDomain?: string;
  /** grid icon alone, for tight headers (label stays as aria-label) */
  iconOnly?: boolean;
  /** trigger content; defaults to a grid icon + label */
  children?: ReactNode;
}) {
  const id = useId();
  const hub = (path: string) => new URL(path, hubUrl).toString();

  return (
    <>
      {/* every app renders this switcher, so the shared sky comes along with it */}
      {ambience && <Ambience />}
      <button
        type="button"
        popoverTarget={id}
        aria-label="สำรวจระบบอื่นใน hub"
        className={cn("inline-flex items-center gap-2", className)}
      >
        {children ?? (
          <>
            <GridIcon />
            {!iconOnly && <span>สำรวจระบบอื่น</span>}
          </>
        )}
      </button>
      <div
        id={id}
        popover="auto"
        aria-label="ระบบทั้งหมดใน hub"
        className="fixed inset-x-0 top-16 m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border bg-popover p-3 text-popover-foreground shadow-xl backdrop:bg-black/20"
      >
        {/* every app carries this panel, so the shared theme switch lives here too */}
        <div className="mb-2 flex items-center gap-2">
          <a
            href={hub("/")}
            className="flex flex-1 items-center gap-3 rounded-xl bg-muted px-3 py-3 font-heading font-bold hover:bg-accent"
          >
            <span aria-hidden>←</span>
            กลับหน้า Portfolio Hub
          </a>
          <AmbienceButton cookieDomain={cookieDomain} className="size-11" />
          <SunMoonThemeToggle cookieDomain={cookieDomain} size={44} />
        </div>
        <ul className="grid grid-cols-2 gap-1">
          {apps.map((app) => {
            const here = app.slug === current;
            return (
              <li key={app.slug}>
                <a
                  href={here ? undefined : hub(`/go/${app.slug}`)}
                  aria-current={here ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-col gap-0.5 rounded-xl px-3 py-2.5",
                    here ? "bg-secondary" : "hover:bg-accent",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: app.accent }}
                    />
                    {app.name}
                  </span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    {here ? "คุณอยู่ที่นี่" : app.summary}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

function GridIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="currentColor">
      {[5, 12, 19].flatMap((y) =>
        [5, 12, 19].map((x) => <circle key={`${String(x)}-${String(y)}`} cx={x} cy={y} r={2} />),
      )}
    </svg>
  );
}
