"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Fine threads across the frame, each swaying on its own slow wave; the pointer pulls them toward it. */
export default function ThreadDrift({ lines = 28, sway = 1 }: { lines?: number; sway?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-500", "--em-sky-400", "--em-ink-200"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const seeds = Array.from({ length: lines }, () => Math.random() * 100);
        let pull = 0;
        return {
          draw: (t, dt) => {
            ctx.clearRect(0, 0, s.w, s.h);
            pull += ((s.pointer.on ? 1 : 0) - pull) * Math.min(1, dt * 3);
            ctx.lineWidth = 1;
            seeds.forEach((seed, i) => {
              const base = s.h * (0.2 + (0.6 * i) / Math.max(1, lines - 1));
              ctx.strokeStyle = colors[i % colors.length] ?? "#fff";
              ctx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(seed));
              ctx.beginPath();
              for (let x = 0; x <= s.w; x += 6) {
                const u = x / s.w;
                const env = Math.sin(u * Math.PI);
                let y =
                  base +
                  env *
                    sway *
                    s.h *
                    0.12 *
                    (Math.sin(u * 5 + t * 0.6 + seed) * 0.6 +
                      Math.sin(u * 11 - t * 0.9 + seed * 2) * 0.4);
                const near = Math.exp(-Math.abs(x - s.pointer.x) / (s.w * 0.12));
                y += (s.pointer.y - y) * near * pull * 0.35;
                if (x) ctx.lineTo(x, y);
                else ctx.moveTo(x, y);
              }
              ctx.stroke();
            });
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, lines, sway],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
