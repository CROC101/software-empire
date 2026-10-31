"use client";

import * as React from "react";
import { cn } from "../lib/cn";

const CURVES = {
  linear: (p: number) => p,
  smooth: (p: number) => p * p * (3 - 2 * p),
  sharp: (p: number) => p * p * p,
};

/**
 * A list of section links that lean toward the pointer: each label slides out and takes the
 * accent as the cursor nears it, its marker line grows, and the ticks between items grow with
 * it. One rAF loop eases every item's `--effect` (0..1) at once, so colour, shift and length move
 * together. Each item is a real link (keyboard reachable); `activeHref` marks the current one.
 *
 * After React Bits' LineSidebar (MIT): same proximity motion, rebuilt as links with `href`
 * instead of click-only items; colours come from tokens (`.line-sidebar` in styles.css). Left out:
 * per-instance colour props and `onItemClick`.
 */
export function LineSidebar({
  items,
  activeHref,
  showIndex = true,
  showMarker = true,
  proximityRadius = 100,
  falloff = "smooth",
  smoothing = 100,
  className,
  style,
}: {
  items: { label: string; href: string }[];
  activeHref?: string;
  showIndex?: boolean;
  showMarker?: boolean;
  /** px above / below an item within which the pointer pulls it */
  proximityRadius?: number;
  falloff?: keyof typeof CURVES;
  /** ms the proximity response takes to settle */
  smoothing?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const listRef = React.useRef<HTMLUListElement>(null);
  const itemRefs = React.useRef<(HTMLLIElement | null)[]>([]);
  const targets = React.useRef<number[]>([]);
  const current = React.useRef<number[]>([]);
  const raf = React.useRef(0);
  const last = React.useRef(0);
  const live = React.useRef({ activeHref, smoothing, items });
  live.current = { activeHref, smoothing, items };

  const frame = React.useCallback((now: number) => {
    const dt = Math.min((now - last.current) / 1000, 0.05);
    last.current = now;
    const k = 1 - Math.exp(-dt / (Math.max(live.current.smoothing, 1) / 1000));
    let moving = false;
    for (const [i, el] of itemRefs.current.entries()) {
      if (!el) continue;
      const target = Math.max(
        targets.current[i] ?? 0,
        live.current.items[i]?.href === live.current.activeHref ? 1 : 0,
      );
      const cur = current.current[i] ?? 0;
      const next = cur + (target - cur) * k;
      const settled = Math.abs(target - next) < 0.0015;
      current.current[i] = settled ? target : next;
      el.style.setProperty("--effect", (settled ? target : next).toFixed(4));
      if (!settled) moving = true;
    }
    raf.current = moving ? requestAnimationFrame(frame) : 0;
  }, []);

  const start = React.useCallback(() => {
    cancelAnimationFrame(raf.current);
    last.current = performance.now();
    raf.current = requestAnimationFrame(frame);
  }, [frame]);

  React.useEffect(() => {
    start();
  }, [activeHref, start]);
  React.useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const onMove = (e: React.PointerEvent<HTMLUListElement>) => {
    const list = listRef.current;
    if (!list) return;
    const y = e.clientY - list.getBoundingClientRect().top;
    const ease = CURVES[falloff];
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const d = Math.abs(y - (el.offsetTop + el.offsetHeight / 2));
      targets.current[i] = ease(Math.max(0, 1 - d / proximityRadius));
    });
    start();
  };

  const onLeave = () => {
    targets.current = targets.current.map(() => 0);
    start();
  };

  return (
    <nav
      className={cn("line-sidebar", showMarker && "line-sidebar--markers", className)}
      style={style}
    >
      <ul
        ref={listRef}
        className="line-sidebar__list"
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        {items.map((item, i) => (
          <li
            key={item.href}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="line-sidebar__item"
          >
            {showMarker && <span className="line-sidebar__marker" aria-hidden />}
            <a
              href={item.href}
              className="line-sidebar__label"
              aria-current={item.href === activeHref ? "location" : undefined}
            >
              {showIndex && (
                <span className="line-sidebar__index" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
