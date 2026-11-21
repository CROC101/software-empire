"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A row of thin slats that turn in a wave, bright when they face you and edge-on when they do not. */
export default function TurnSlats({ speed = 1, slats = 32 }: { speed?: number; slats?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-700", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = ""] = colors;
        return {
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            const w = s.w / slats;
            for (let i = 0; i < slats; i++) {
              const a = Math.sin(i * 0.35 - T * 1.5);
              const sw = Math.max(1, Math.abs(a) * w * 0.9);
              ctx.fillStyle = a > 0 ? c1 : c0;
              ctx.globalAlpha = 0.35 + 0.65 * Math.abs(a);
              ctx.fillRect(i * w + (w - sw) / 2, 0, sw, s.h);
            }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, speed, slats],
    { pointer: false },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
