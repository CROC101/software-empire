"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A scan line crosses a grid from left to right, lighting the cells it passes. */
export default function GridSweep({ speed = 1, cell = 32 }: { speed?: number; cell?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-700", "--em-sky-400", "--em-ink-0"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = "", c2 = ""] = colors;
        return {
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            const xs = (((T * 0.25) % 1.3) - 0.15) * s.w;
            ctx.lineWidth = 1;
            for (let x = 0; x <= s.w; x += cell) {
              const near = Math.exp(-(((x - xs) / 60) ** 2));
              ctx.strokeStyle = near > 0.2 ? c1 : c0;
              ctx.globalAlpha = 0.2 + near * 0.8;
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, s.h);
              ctx.stroke();
            }
            ctx.strokeStyle = c0;
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            for (let y = 0; y <= s.h; y += cell) {
              ctx.moveTo(0, y);
              ctx.lineTo(s.w, y);
            }
            ctx.stroke();
            ctx.fillStyle = c1;
            for (let y = 0; y < s.h; y += cell)
              for (let x = 0; x < s.w; x += cell) {
                const lit = Math.max(0, 1 - Math.abs(x + cell / 2 - xs) / (cell * 3));
                if (lit <= 0) continue;
                ctx.globalAlpha = lit * 0.5 * (0.5 + 0.5 * Math.sin(x * 0.7 + y * 1.3));
                ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
              }
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = c2;
            ctx.fillRect(xs - 1, 0, 2, s.h);
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, speed, cell],
    { pointer: false },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
