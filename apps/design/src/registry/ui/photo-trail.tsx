"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { useEffect, useRef } from "react";

const pics = [
  "aurora-tide",
  "deep-galaxy",
  "dither-tide",
  "float-particles",
  "particle-title",
  "ripple-mesh",
  "ripple-pond",
  "tide-plasma",
  "warp-lanes",
  "where-globe",
].map((n) => `/orbit/${n}.webp`);

/**
 * Move across the frame and pictures drop behind the pointer, one every few dozen pixels, then
 * shrink and fade. At most a dozen are alive at once. Reduced motion shows nothing moving.
 */
export default function PhotoTrail({ gap = 80, size = 120 }: { gap?: number; size?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const still = useReducedMotionAfterMount();

  useEffect(() => {
    const el = box.current;
    if (!el || still) return;
    let lx = Number.NaN;
    let ly = Number.NaN;
    let n = 0;
    const live: HTMLImageElement[] = [];
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (Math.hypot(x - lx, y - ly) < gap) return;
      lx = x;
      ly = y;
      const img = document.createElement("img");
      img.src = pics[n++ % pics.length] ?? "";
      img.alt = "";
      img.className = "vt-live pointer-events-none absolute top-0 left-0 rounded-lg object-cover";
      Object.assign(img.style, { width: `${String(size)}px`, height: `${String(size * 0.75)}px` });
      el.append(img);
      live.push(img);
      if (live.length > 12) live.shift()?.remove();
      const at = `translate(${String(x - size / 2)}px, ${String(y - size * 0.375)}px)`;
      img
        .animate(
          [
            { transform: `${at} scale(0.6)`, opacity: 0 },
            { transform: `${at} scale(1)`, opacity: 1, offset: 0.15 },
            { transform: `${at} scale(0.85)`, opacity: 1, offset: 0.6 },
            { transform: `${at} scale(0.5)`, opacity: 0 },
          ],
          { duration: 1400, easing: "ease-out", fill: "forwards" },
        )
        .finished.then(() => {
          img.remove();
          const i = live.indexOf(img);
          if (i >= 0) live.splice(i, 1);
        })
        .catch(() => undefined);
    };
    el.addEventListener("pointermove", move);
    return () => {
      el.removeEventListener("pointermove", move);
      for (const img of live) img.remove();
    };
  }, [gap, size, still]);

  return (
    <div
      ref={box}
      className="relative grid size-full min-h-72 place-items-center overflow-hidden bg-(--em-ink-975)"
    >
      <p className="pointer-events-none font-heading text-3xl font-black text-(--em-ink-700)">
        ลากผ่านเพื่อดูงาน
      </p>
    </div>
  );
}
