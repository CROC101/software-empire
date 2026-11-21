"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Soft rays of light fan in from the upper left edge, each breathing and swaying on its own beat. */
export default function ShoreRays({ speed = 0.5, rays = 9 }: { speed?: number; rays?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-sky-400", "--em-ink-0"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = ""] = colors;
        return {
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            const L = Math.hypot(s.w, s.h);
            const oy = s.h * 0.1;
            for (let k = 0; k < rays; k++) {
              const a = 0.05 + (k / Math.max(1, rays - 1)) * 0.8 + Math.sin(T + k * 1.3) * 0.03;
              const w = 0.03 + 0.03 * (0.5 + 0.5 * Math.sin(T * 0.7 + k));
              ctx.globalAlpha = 0.08 + 0.12 * (0.5 + 0.5 * Math.sin(T * 1.3 + k * 2));
              ctx.fillStyle = k % 3 === 0 ? c1 : c0;
              ctx.beginPath();
              ctx.moveTo(0, oy);
              ctx.lineTo(Math.cos(a - w) * L, oy + Math.sin(a - w) * L);
              ctx.lineTo(Math.cos(a + w) * L, oy + Math.sin(a + w) * L);
              ctx.closePath();
              ctx.fill();
            }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, speed, rays],
    { pointer: false },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
