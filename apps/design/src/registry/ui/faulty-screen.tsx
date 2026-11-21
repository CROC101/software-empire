"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A terminal full of flickering symbols; now and then a row jumps sideways like a bad signal. */
export default function FaultyScreen({ speed = 1, cell = 16 }: { speed?: number; cell?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-600", "--em-sky-400", "--em-ink-0"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = "", c2 = ""] = colors;
        const h = (k: number) => {
          const x = Math.sin(k * 127.1) * 43758.5453;
          return x - Math.floor(x);
        };
        const glyphs = "01<>/{}[]#$%=+";
        return {
          draw: (t) => {
            const T = t * speed;
            const tick = Math.floor(T * 8);
            ctx.clearRect(0, 0, s.w, s.h);
            ctx.font = `${String(cell)}px ui-monospace, monospace`;
            ctx.textBaseline = "top";
            for (let row = 0; row * cell < s.h; row++) {
              const y = row * cell;
              const glitch = h(row + tick * 31) > 0.93 ? (h(row + tick) - 0.5) * cell * 4 : 0;
              ctx.globalAlpha = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(y * 0.8 + T * 6));
              for (let col = 0; col * cell * 0.62 < s.w; col++) {
                const r = h(row * 131 + col * 7 + Math.floor(T * 2 + h(col) * 4) * 17);
                if (r < 0.35) continue;
                ctx.fillStyle = r > 0.97 ? c2 : r > 0.8 ? c1 : c0;
                ctx.fillText(
                  glyphs[Math.floor(r * glyphs.length) % glyphs.length] ?? "",
                  col * cell * 0.62 + glitch,
                  y,
                );
              }
            }
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
