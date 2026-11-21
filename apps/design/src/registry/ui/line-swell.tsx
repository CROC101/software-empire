"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Many thin horizontal lines ripple with a travelling wave whose height rises and falls row by row. */
export default function LineSwell({ speed = 1, lines = 28 }: { speed?: number; lines?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-600", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = ""] = colors;
        return {
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.6;
            for (let i = 0; i < lines; i++) {
              const base = ((i + 0.5) / lines) * s.h;
              ctx.strokeStyle = i % 4 === 0 ? c1 : c0;
              ctx.beginPath();
              for (let x = 0; x <= s.w; x += 6) {
                const y =
                  base + Math.sin(x * 0.01 - T * 2 + i * 0.3) * 10 * Math.sin(T * 0.5 + i * 0.15);
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
    { pointer: false },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
