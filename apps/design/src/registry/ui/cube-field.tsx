"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { useEffect, useRef } from "react";

/**
 * A field of small 3D cubes that turn to face the pointer, the nearest ones most. A click sends a
 * ring of spin outward from where you pressed. CSS 3D, transforms only.
 */
export default function CubeField({ grid = 7, tilt = 45 }: { grid?: number; tilt?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const still = useReducedMotionAfterMount();

  useEffect(() => {
    const el = box.current;
    if (!el || still) return;
    const cubes = [...el.querySelectorAll<HTMLElement>("[data-cube]")];
    let raf = 0;
    let wave: { x: number; y: number; at: number } | null = null;
    let px = -1;
    let py = -1;
    const frame = (now: number) => {
      const r = el.getBoundingClientRect();
      let busy = false;
      for (const c of cubes) {
        const b = c.getBoundingClientRect();
        const cx = b.left + b.width / 2 - r.left;
        const cy = b.top + b.height / 2 - r.top;
        let rx = 0;
        let ry = 0;
        if (px >= 0) {
          const dx = px - cx;
          const dy = py - cy;
          const fall = Math.max(0, 1 - Math.hypot(dx, dy) / (r.width * 0.6));
          ry = Math.max(-1, Math.min(1, dx / 120)) * tilt * fall;
          rx = -Math.max(-1, Math.min(1, dy / 120)) * tilt * fall;
        }
        if (wave) {
          // a ring that travels 600px/s; cubes it is passing get a quarter turn
          const ring = ((now - wave.at) / 1000) * 600 - Math.hypot(cx - wave.x, cy - wave.y);
          if (ring > 0 && ring < 160) {
            rx += Math.sin((ring / 160) * Math.PI) * 90;
            busy = true;
          }
        }
        c.style.transform = `rotateX(${String(rx)}deg) rotateY(${String(ry)}deg)`;
      }
      if (!busy) wave = null;
      raf = busy || px >= 0 ? requestAnimationFrame(frame) : 0;
    };
    const kick = () => (raf ||= requestAnimationFrame(frame));
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
      kick();
    };
    const leave = () => {
      px = -1;
      kick();
    };
    const down = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      wave = { x: e.clientX - r.left, y: e.clientY - r.top, at: performance.now() };
      kick();
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointerdown", down);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerdown", down);
    };
  }, [grid, tilt, still]);

  const face = "absolute inset-0 border border-(--em-blue-500)/50";
  return (
    <div
      ref={box}
      className="grid size-full min-h-72 place-items-center overflow-hidden bg-(--em-ink-975) p-6 [perspective:900px]"
    >
      <div
        className="grid w-full max-w-sm gap-2"
        style={{ gridTemplateColumns: `repeat(${String(grid)}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: grid * grid }, (_, i) => (
          <div
            key={i}
            data-cube
            aria-hidden
            className="vt-live relative aspect-square [container-type:inline-size] [transform-style:preserve-3d] [--h:50cqw]"
          >
            {[
              "translateZ(var(--h))",
              "rotateY(180deg) translateZ(var(--h))",
              "rotateY(90deg) translateZ(var(--h))",
              "rotateY(-90deg) translateZ(var(--h))",
              "rotateX(90deg) translateZ(var(--h))",
              "rotateX(-90deg) translateZ(var(--h))",
            ].map((t, f) => (
              <span
                key={t}
                className={`${face} ${f === 4 ? "bg-(--em-blue-700)" : "bg-(--em-ink-900)"}`}
                style={{ transform: t }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
