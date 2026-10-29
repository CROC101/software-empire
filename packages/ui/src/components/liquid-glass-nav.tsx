"use client";

import { Grip } from "lucide-react";
import { motion, useSpring, useTransform, useVelocity } from "motion/react";
import * as React from "react";
import { cn } from "../lib/cn";
import { useReducedMotionAfterMount } from "../lib/use-reduced-motion";

/**
 * Liquid glass nav: a frosted capsule of icon + label links with a clear glass droplet over the
 * current one. Pick another link (or scroll to its section) and the droplet flows there on a
 * spring: it stretches with its speed, its rim turns iridescent while it moves and settles back
 * to blue, and what sits under it bends like through a lens (Chromium; elsewhere a soft blur).
 * Hovering a link draws a thin iridescent glint on its top edge. Styles: `.lgn` in styles.css.
 *
 * Our own build after the look of "Liquid Glass Navbar" (21st.dev). `AppLauncher` is the
 * Google-style nine-dot grid of the studio's apps, usable inside the capsule or on its own.
 */

export type LiquidNavItem = { href: string; label: string; icon: React.ReactNode };
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

export function LiquidGlassNav({
  items,
  launcher,
  label,
  className,
}: {
  items: readonly LiquidNavItem[];
  /** The nine-dot app grid at the end of the capsule. */
  launcher?: React.ComponentProps<typeof AppLauncher>;
  /** Accessible name of the nav. */
  label: string;
  className?: string;
}) {
  const uid = React.useId().replace(/:/g, "");
  const listRef = React.useRef<HTMLUListElement>(null);
  const linkRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const [active, setActive] = React.useState(0);
  const [placed, setPlaced] = React.useState(false);
  const activeRef = React.useRef(0);
  const reduced = useReducedMotionAfterMount();

  // the droplet's position and width, on springs; its stretch and rim colour come from its speed
  const spring = reduced
    ? { stiffness: 1000, damping: 100 }
    : { stiffness: 340, damping: 26, mass: 0.9 };
  const x = useSpring(0, spring);
  const w = useSpring(0, spring);
  const v = useVelocity(x);
  const speed = useTransform(v, (s) => Math.min(Math.abs(s) / 1400, 1));
  const scaleX = useTransform(speed, [0, 1], [1, 1.22]);
  const scaleY = useTransform(speed, [0, 1], [1, 0.84]);
  const rainbow = useTransform(speed, [0, 0.15, 1], [0, 0.85, 1]);

  const moveTo = React.useCallback(
    (i: number, jump = false) => {
      const list = listRef.current;
      const el = linkRefs.current[i];
      if (!list || !el) return;
      const l = el.getBoundingClientRect();
      const r = list.getBoundingClientRect();
      if (jump) {
        x.jump(l.left - r.left);
        w.jump(l.width);
      } else {
        x.set(l.left - r.left);
        w.set(l.width);
      }
    },
    [x, w],
  );

  // place without animating, and again whenever the capsule changes size (fonts, breakpoints)
  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const ro = new ResizeObserver(() => {
      moveTo(activeRef.current, true);
      setPlaced(true);
    });
    ro.observe(list);
    return () => {
      ro.disconnect();
    };
  }, [moveTo]);
  React.useEffect(() => {
    activeRef.current = active;
    moveTo(active);
  }, [active, moveTo]);

  // scroll spy: the section crossing the band 35–45% down the screen is the current one
  React.useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = items.findIndex((it) => it.href === `#${e.target.id}`);
          if (i >= 0) setActive(i);
        }
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    for (const { href } of items) {
      const el = href.startsWith("#") ? document.getElementById(href.slice(1)) : null;
      if (el) io.observe(el);
    }
    return () => {
      io.disconnect();
    };
  }, [items]);

  return (
    <nav aria-label={label} className={cn("lgn", className)}>
      {/* the lens: a gentle displacement of whatever shows through the droplet */}
      <svg aria-hidden className="absolute size-0">
        <filter id={`lgn-lens-${uid}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="1" seed="4" />
          <feDisplacementMap
            in="SourceGraphic"
            scale="9"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
      <ul ref={listRef} className="lgn-list">
        <motion.li
          aria-hidden
          className="lgn-drop"
          style={{
            x,
            width: w,
            scaleX,
            scaleY,
            opacity: placed ? 1 : 0,
            backdropFilter: `url(#lgn-lens-${uid}) blur(0.4px) saturate(1.5)`,
          }}
        >
          <span className="lgn-rim lgn-rim--blue" />
          <motion.span className="lgn-rim lgn-rim--rainbow" style={{ opacity: rainbow }} />
          <span className="lgn-shine" />
        </motion.li>
        {items.map((item, i) => (
          <li key={item.href} className="relative">
            <a
              ref={(el) => {
                linkRefs.current[i] = el;
              }}
              href={item.href}
              aria-current={i === active ? "location" : undefined}
              title={item.label}
              onClick={() => {
                setActive(i);
              }}
              className="lgn-link"
            >
              <span aria-hidden className="lgn-glint" />
              <span aria-hidden className="[&_svg]:size-4">
                {item.icon}
              </span>
              <span className="lgn-label">{item.label}</span>
            </a>
          </li>
        ))}
        {launcher && (
          <li className="relative ml-1 border-l pl-1.5">
            <AppLauncher {...launcher} />
          </li>
        )}
      </ul>
    </nav>
  );
}
