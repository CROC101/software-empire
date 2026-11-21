"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Smooth lines at different depths float on slow waves; the pointer pulls the nearest part of each toward it. */
export default function DriftLines({ speed = 0.5, lines = 7 }: { speed?: number; lines?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-500", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = ""] = colors;
        return {
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            for (let i = 0; i < lines; i++) {
              const depth = (i + 1) / lines;
              const base = s.h * (0.2 + 0.6 * (i / Math.max(1, lines - 1)));
              ctx.strokeStyle = i % 2 === 0 ? c0 : c1;
              ctx.globalAlpha = 0.25 + depth * 0.6;
              ctx.lineWidth = 0.75 + depth * 1.5;
              ctx.beginPath();
              for (let x = 0; x <= s.w; x += 8) {
                const near = s.pointer.on
                  ? Math.exp(-(((x - s.pointer.x) / 120) ** 2)) *
                    (s.pointer.y - base) *
                    0.35 *
                    depth
                  : 0;
                const y =
                  base +
                  Math.sin(x * 0.006 + T + i) * 18 * depth +
                  Math.sin(x * 0.013 - T * 0.7 + i * 2) * 8 +
                  near;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, speed, lines],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
