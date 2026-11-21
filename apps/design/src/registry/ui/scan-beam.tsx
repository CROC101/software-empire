"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A bright line sweeps up and down over a dot grid, lighting the dots as it passes. */
export default function ScanBeam({ speed = 1, gap = 18 }: { speed?: number; gap?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-600", "--em-sky-400", "--em-ink-0"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = "", c2 = ""] = colors;
        return {
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            const yb = (0.5 - 0.5 * Math.cos(T * 0.8)) * s.h;
            for (let y = gap / 2; y < s.h; y += gap)
              for (let x = gap / 2; x < s.w; x += gap) {
                const near = Math.exp(-(((y - yb) / 40) ** 2));
                ctx.globalAlpha = 0.15 + 0.85 * near;
                ctx.fillStyle = near > 0.3 ? c1 : c0;
                ctx.fillRect(x - 1, y - 1, 2 + near * 2, 2 + near * 2);
              }
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = c2;
            ctx.fillRect(0, yb - 1, s.w, 2);
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, speed, gap],
    { pointer: false },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
