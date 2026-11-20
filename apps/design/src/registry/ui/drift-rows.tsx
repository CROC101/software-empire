"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { useEffect, useRef } from "react";

/**
 * Two bands of text drift in opposite directions. Scroll the wheel or swipe over them and they
 * speed up with you, flip with your direction, then ease back to their idle pace.
 */
export default function DriftRows({
  text = "crocwork ✦ design ✦ registry ✦ ",
  speed = 40,
  boost = 6,
}: {
  text?: string;
  speed?: number;
  boost?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const still = useReducedMotionAfterMount();

  useEffect(() => {
    const el = box.current;
    if (!el || still) return;
    const rows = [...el.querySelectorAll<HTMLElement>("[data-row]")];
    const pos = rows.map(() => 0);
    let extra = 0;
    let dir = 1;
    let lastY: number | null = null;
    let last = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      const dt = Math.min(now - last, 50) / 1000;
      last = now;
      extra *= 0.94;
      rows.forEach((r, i) => {
        const w = r.scrollWidth / 4;
        const sign = i % 2 ? -1 : 1;
        pos[i] = ((((pos[i] ?? 0) - sign * dir * (speed + extra) * dt) % w) - w) % w;
        r.style.transform = `translateX(${String(pos[i])}px)`;
      });
      raf = requestAnimationFrame(tick);
    });
    const kick = (dy: number) => {
      if (dy === 0) return;
      dir = dy > 0 ? 1 : -1;
      extra = Math.min(extra + Math.abs(dy) * boost, 2000);
    };
    const wheel = (e: WheelEvent) => {
      kick(e.deltaY);
    };
    const touch = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? null;
      if (y !== null && lastY !== null) kick(lastY - y);
      lastY = y;
    };
    const end = () => (lastY = null);
    el.addEventListener("wheel", wheel, { passive: true });
    el.addEventListener("touchmove", touch, { passive: true });
    el.addEventListener("touchend", end);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("touchmove", touch);
      el.removeEventListener("touchend", end);
    };
  }, [speed, boost, still]);

  return (
    <div
      ref={box}
      aria-label={text}
      role="img"
      className="grid size-full min-h-56 content-center gap-2 overflow-hidden bg-(--em-ink-975) py-6"
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          data-row
          aria-hidden
          className={`vt-live w-max font-heading text-5xl font-black whitespace-pre sm:text-7xl ${i ? "text-(--em-ink-600)" : "text-(--em-ink-50)"}`}
        >
          {text.repeat(4)}
        </div>
      ))}
    </div>
  );
}
