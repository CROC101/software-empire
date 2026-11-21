"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

type Dot = { hx: number; hy: number; x: number; y: number };

/** A grid of dots that leans away from the pointer and drifts home; with no pointer, a ghost wanders through. */
export default function DodgeField({ radius = 90, gap = 22 }: { radius?: number; gap?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-600", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        let dots: Dot[] = [];
        return {
          resize: () => {
            dots = [];
            for (let y = gap / 2; y < s.h; y += gap)
              for (let x = gap / 2; x < s.w; x += gap) dots.push({ hx: x, hy: y, x, y });
          },
          draw: (t, dt) => {
            const px = s.pointer.on ? s.pointer.x : s.w / 2 + Math.cos(t * 0.6) * s.w * 0.3;
            const py = s.pointer.on ? s.pointer.y : s.h / 2 + Math.sin(t * 0.9) * s.h * 0.3;
            const ease = dt ? Math.min(1, dt * 8) : 1;
            ctx.clearRect(0, 0, s.w, s.h);
            for (const d of dots) {
              const dx = d.hx - px;
              const dy = d.hy - py;
              const dist = Math.hypot(dx, dy) || 1;
              const push = Math.max(0, 1 - dist / radius);
              const tx = d.hx + (dx / dist) * push * radius * 0.5;
              const ty = d.hy + (dy / dist) * push * radius * 0.5;
              d.x += (tx - d.x) * ease;
              d.y += (ty - d.y) * ease;
              ctx.fillStyle = (push > 0.05 ? colors[1] : colors[0]) ?? "";
              ctx.beginPath();
              ctx.arc(d.x, d.y, 1.5 + push * 2, 0, Math.PI * 2);
              ctx.fill();
            }
          },
        };
      }),
    [colors, radius, gap],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
