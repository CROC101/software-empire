"use client";

import { fxRamp, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A tall pillar of light with rippling edges and bands that twist up through it. */
export default function LightColumn({ speed = 1, width = 1 }: { speed?: number; width?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-975", "--em-blue-800", "--em-sky-400", "--em-ink-0"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const ramp = fxRamp(colors);
        let img = ctx.createImageData(1, 1);
        return {
          resize: () => {
            img = ctx.createImageData(s.pw, s.ph);
          },
          draw: (t) => {
            const d = img.data;
            const T = t * speed;
            const A = s.pw / s.ph;
            let o = 0;
            for (let y = 0; y < s.ph; y++) {
              const v = y / s.ph;
              for (let x = 0; x < s.pw; x++) {
                const u = x / s.ph;
                const cx = u - A / 2;
                const edge = cx + 0.04 * Math.sin(v * 9 - T * 2) * (1 + v);
                const glow = Math.exp(-((edge / (0.06 * width)) ** 2));
                const n = glow * (0.75 + 0.25 * Math.sin(v * 30 + cx * 40 - T * 4));
                const i = (Math.max(0, Math.min(1, n)) * 255) | 0;
                d[o] = ramp[i * 3] ?? 0;
                d[o + 1] = ramp[i * 3 + 1] ?? 0;
                d[o + 2] = ramp[i * 3 + 2] ?? 0;
                d[o + 3] = 255;
                o += 4;
              }
            }
            ctx.putImageData(img, 0, 0);
          },
        };
      }),
    [colors, speed, width],
    { res: 0.25 },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
