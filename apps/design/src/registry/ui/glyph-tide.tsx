"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A grid of ASCII characters whose density follows a slowly moving gradient. */
export default function GlyphTide({ speed = 1, cell = 14 }: { speed?: number; cell?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-500", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = ""] = colors;
        const chars = " .:-=+*#%@";
        return {
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            ctx.font = `${String(cell)}px ui-monospace, monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            for (let y = cell / 2; y < s.h; y += cell)
              for (let x = cell / 2; x < s.w; x += cell * 0.6) {
                const n =
                  0.5 +
                  0.5 * Math.sin(x * 0.012 + T) * Math.cos(y * 0.015 - T * 0.7) +
                  0.25 * Math.sin((x + y) * 0.008 + T * 0.5);
                const k = Math.max(0, Math.min(chars.length - 1, Math.floor(n * chars.length)));
                ctx.fillStyle = n > 0.7 ? c1 : c0;
                ctx.fillText(chars[k] ?? "", x, y);
              }
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
