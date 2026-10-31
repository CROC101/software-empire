"use client";

import * as React from "react";
import { cn } from "../lib/cn";

export type RailItem = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  /** A palette token for the pressed button, e.g. "var(--em-blue-500)". */
  color?: string;
};

/**
 * A row of pill buttons that picks one screen out of many. It scrolls sideways on its own and
 * keeps the pressed button centred (inside the row only, never the page), so it holds 4 screens
 * or 100 without growing the page.
 */
export function ScreenRail({
  items,
  active,
  onPick,
  label,
  className,
}: {
  items: readonly RailItem[];
  active: number;
  onPick: (i: number) => void;
  /** Accessible name of the row, e.g. "เลือกหน้าจอ". */
  label: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const rail = ref.current;
    const btn = rail?.children[active] as HTMLElement | undefined;
    if (!rail || !btn) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollTo({
      left: btn.offsetLeft - rail.clientWidth / 2 + btn.offsetWidth / 2,
      behavior: calm ? "auto" : "smooth",
    });
  }, [active]);
  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={cn(
        "screen-rail relative flex max-w-full snap-x gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none]",
        className,
      )}
    >
      {items.map((it, i) => (
        <button
          key={it.key}
          type="button"
          aria-pressed={i === active}
          onClick={() => {
            onPick(i);
          }}
          className={cn(
            "flex shrink-0 snap-center items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors duration-300 [&_svg]:size-3.5",
            i === active
              ? "border-transparent text-white"
              : "bg-background/70 text-muted-foreground hover:text-foreground",
          )}
          style={i === active ? { background: it.color ?? "var(--em-blue-600)" } : undefined}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </div>
  );
}

/** Steps `active` forward every `interval` ms while `on`; restarts the wait after each change. */
export function useAutoplay(
  count: number,
  active: number,
  setActive: React.Dispatch<React.SetStateAction<number>>,
  on: boolean,
  interval: number,
) {
  React.useEffect(() => {
    if (!on || count < 2) return;
    const t = window.setTimeout(() => {
      setActive((i) => (i + 1) % count);
    }, interval);
    return () => {
      window.clearTimeout(t);
    };
  }, [on, count, active, setActive, interval]);
}
