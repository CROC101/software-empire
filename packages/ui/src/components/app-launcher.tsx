"use client";

import { Grip } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/cn";

/**
 * App launcher: a Google-style nine-dot button that opens a glass grid of the studio's apps
 * (native popover: light dismiss, Escape and focus return come from the browser). Open apps are
 * links; ones not live yet show dimmed. Styles: `.lgn-launch`, `.lgn-apps` in styles.css.
 */

export type LauncherApp = {
  slug: string;
  name: string;
  href: string;
  icon: React.ReactNode;
  /** A palette token for the tile, e.g. "var(--em-violet-600)". */
  accent: string;
  /** Not open yet: shown dimmed, not a link. */
  soon?: boolean;
};

export function AppLauncher({
  apps,
  label,
  soonLabel,
  className,
}: {
  apps: readonly LauncherApp[];
  /** Name of the button and the panel, e.g. "แอปทั้งหมด". */
  label: string;
  soonLabel: string;
  className?: string;
}) {
  const id = React.useId().replace(/:/g, "");
  return (
    <>
      <button
        type="button"
        popoverTarget={`lgn-apps-${id}`}
        aria-label={label}
        title={label}
        className={cn("lgn-launch", className)}
      >
        <Grip aria-hidden className="size-[18px]" strokeWidth={2.4} />
      </button>
      <div id={`lgn-apps-${id}`} popover="auto" className="lgn-apps" aria-label={label}>
        <p className="mb-3 px-1 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          {label}
        </p>
        <ul className="grid grid-cols-3 gap-1">
          {apps.map((app) => {
            const tile = (
              <>
                <span
                  aria-hidden
                  className="grid size-12 place-items-center rounded-2xl text-white shadow-md [&_svg]:size-6"
                  style={{
                    background: `linear-gradient(145deg, color-mix(in oklab, ${app.accent} 80%, white), ${app.accent})`,
                  }}
                >
                  {app.icon}
                </span>
                <span className="line-clamp-1 text-xs font-semibold">{app.name}</span>
                {app.soon && <span className="text-[10px] text-muted-foreground">{soonLabel}</span>}
              </>
            );
            return (
              <li key={app.slug}>
                {app.soon ? (
                  <span aria-disabled className="lgn-app opacity-45">
                    {tile}
                  </span>
                ) : (
                  <a href={app.href} className="lgn-app">
                    {tile}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
