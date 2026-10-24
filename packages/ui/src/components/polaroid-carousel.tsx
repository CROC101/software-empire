"use client";

import * as React from "react";
import { cn } from "../lib/cn";

/**
 * Polaroid carousel: instant photos pegged to a sagging string. Drag and they slide along it,
 * each one swinging on its peg with your speed, then settling; the nearest one to the middle
 * comes forward. Click a photo, the arrows, the keyboard or autoplay move it too.
 *
 * Our own build after "Hanging Polaroid Image Carousel" (21st.dev). Positions are written
 * straight to the DOM from one rAF loop that sleeps when everything is still; autoplay pauses
 * off screen, while interacting and under reduced motion (which also drops the swing).
 */

export type Polaroid = { src: string; alt: string; caption: string; note?: string };

const SPACING = 250; // px between pegs along the string
const CARD_W = 210;
const SAG = 46; // how far the middle of the string hangs below its ends

export function PolaroidCarousel({
  items,
  autoplayMs = 4500,
  labels = { prev: "Previous", next: "Next", region: "Photos" },
  className,
}: {
  items: Polaroid[];
  autoplayMs?: number;
  labels?: { prev: string; next: string; region: string };
  className?: string;
}) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = React.useState(0);
  const [st] = React.useState(() => ({
    W: 0,
    offset: 0, // px along the string; item i is centred when offset = i * SPACING
    vel: 0,
    target: 0,
    swing: [] as { a: number; v: number }[],
    drag: null as null | { x: number; offset: number; lastX: number; t: number; moved: number },
    raf: 0,
    visible: false,
    reduced: false,
    lastInteract: 0,
    active: 0,
  }));
  const n = items.length;

  const stringY = React.useCallback(
    (x: number) => {
      const half = st.W / 2 || 1;
      const u = (x - half) / half;
      return 40 + SAG * (1 - Math.min(1, u * u));
    },
    [st],
  );

  const frame = React.useCallback(() => {
    st.raf = 0;
    const prev = st.offset;
    if (!st.drag) {
      if (st.reduced) {
        st.offset = st.target;
        st.vel = 0;
      } else {
        st.vel += (st.target - st.offset) * 0.09;
        st.vel *= 0.76;
        st.offset += st.vel;
      }
    }
    const moved = st.offset - prev;
    let busy = Boolean(st.drag) || Math.abs(st.target - st.offset) > 0.3 || Math.abs(st.vel) > 0.05;

    const cx = st.W / 2;
    for (let i = 0; i < n; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const s = (st.swing[i] ??= { a: 0, v: 0 });
      if (!st.reduced) {
        // the photo lags behind the string: swing against the direction of travel
        const drive = Math.max(-28, Math.min(28, -moved * 0.9));
        s.v += (drive - s.a) * 0.08;
        s.v *= 0.9;
        s.a += s.v;
        if (Math.abs(s.a) > 0.05 || Math.abs(s.v) > 0.05) busy = true;
      }
      const x = cx + i * SPACING - st.offset;
      const near = Math.max(0, 1 - Math.abs(x - cx) / SPACING);
      const scale = 0.88 + 0.12 * near;
      el.style.transform = `translate3d(${(x - CARD_W / 2).toFixed(1)}px, ${stringY(x).toFixed(1)}px, 0) rotate(${(s.a + (i % 2 ? 1.5 : -1.5)).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      el.style.zIndex = String(Math.round(near * 10));
      el.style.opacity = x < -CARD_W || x > st.W + CARD_W ? "0" : "1";
    }
    const now = Math.round(st.offset / SPACING);
    if (now !== st.active && now >= 0 && now < n) {
      st.active = now;
      setActive(now);
    }
    if (busy) st.raf = requestAnimationFrame(frame);
  }, [st, n, stringY]);

  const wake = React.useCallback(() => {
    if (!st.raf) st.raf = requestAnimationFrame(frame);
  }, [st, frame]);

  const go = React.useCallback(
    (i: number) => {
      st.target = Math.max(0, Math.min(n - 1, i)) * SPACING;
      st.lastInteract = performance.now();
      wake();
    },
    [st, n, wake],
  );

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    st.reduced = mq.matches;
    const box = boxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(() => {
      st.W = box.clientWidth;
      wake();
    });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => {
      st.visible = Boolean(e?.isIntersecting);
    });
    io.observe(box);
    // start in the middle of the set so there are photos on both sides
    st.offset = st.target = Math.floor(n / 2) * SPACING;
    const auto = window.setInterval(() => {
      if (
        !st.visible ||
        st.reduced ||
        st.drag ||
        performance.now() - st.lastInteract < autoplayMs * 1.5
      )
        return;
      const next = st.active + 1 >= n ? 0 : st.active + 1;
      st.target = next * SPACING;
      wake();
    }, autoplayMs);
    return () => {
      ro.disconnect();
      io.disconnect();
      window.clearInterval(auto);
      cancelAnimationFrame(st.raf);
      st.raf = 0;
    };
  }, [st, n, autoplayMs, wake]);

  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    st.drag = { x: e.clientX, offset: st.offset, lastX: e.clientX, t: performance.now(), moved: 0 };
    st.vel = 0;
    st.lastInteract = performance.now();
    wake();
  };
  const onMove = (e: React.PointerEvent) => {
    const d = st.drag;
    if (!d) return;
    const raw = d.offset - (e.clientX - d.x);
    const max = (n - 1) * SPACING;
    // rubber band past either end
    st.offset = raw < 0 ? raw * 0.35 : raw > max ? max + (raw - max) * 0.35 : raw;
    st.vel = -(e.clientX - d.lastX);
    d.moved += Math.abs(e.clientX - d.lastX);
    d.lastX = e.clientX;
    wake();
  };
  const onUp = (e: React.PointerEvent) => {
    const d = st.drag;
    st.drag = null;
    if (!d) return;
    if (d.moved < 6) {
      // a click: bring the photo under the pointer to the middle
      const r = boxRef.current?.getBoundingClientRect();
      const x = e.clientX - (r?.left ?? 0);
      go(Math.round((x - st.W / 2 + st.offset) / SPACING));
      return;
    }
    go(Math.round((st.offset + st.vel * 6) / SPACING)); // a flick carries a little further
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.region}
      tabIndex={0}
      className={cn("relative outline-none", className)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(st.active - 1);
        if (e.key === "ArrowRight") go(st.active + 1);
      }}
    >
      <div
        ref={boxRef}
        className="relative h-[460px] cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <svg
          aria-hidden
          className="absolute inset-0 size-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          {/* the string, as a parabola matching stringY (viewBox units) */}
          <path
            d="M0 8.7 Q50 28.7 100 8.7"
            fill="none"
            vectorEffect="non-scaling-stroke"
            className="stroke-[var(--em-ink-500)]"
            strokeWidth={1.5}
          />
        </svg>
        {items.map((it, i) => (
          <div
            key={it.src}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            aria-hidden={i !== active}
            className="absolute left-0 top-0 origin-top"
            style={{ width: CARD_W }}
          >
            {/* the wooden peg */}
            <span
              aria-hidden
              className="absolute -top-3 left-1/2 z-10 h-7 w-3 -translate-x-1/2 rounded-[3px] bg-gradient-to-b from-[var(--em-gold-300)] to-[var(--em-gold-500)] shadow-sm"
            />
            <figure className="bg-[var(--em-ink-0)] p-3 pb-4 text-[var(--em-ink-900)] shadow-[0_18px_30px_-12px_oklch(0_0_0/0.45)]">
              <img
                src={it.src}
                alt={it.alt}
                width={CARD_W - 24}
                height={CARD_W - 24}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="aspect-square w-full bg-[var(--em-ink-100)] object-cover object-top"
              />
              <figcaption className="mt-3 text-center">
                <span className="block font-black">{it.caption}</span>
                {it.note && (
                  <span className="block font-mono text-[10px] text-[var(--em-ink-500)]">
                    {it.note}
                  </span>
                )}
              </figcaption>
            </figure>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => go(active - 1)}
          aria-label={labels.prev}
          className="grid size-10 place-items-center border"
        >
          ←
        </button>
        <p
          aria-live="polite"
          className="min-w-40 text-center font-mono text-xs text-muted-foreground"
        >
          {items[active]?.caption} · {active + 1}/{n}
        </p>
        <button
          type="button"
          onClick={() => go(active + 1)}
          aria-label={labels.next}
          className="grid size-10 place-items-center border"
        >
          →
        </button>
      </div>
    </div>
  );
}
