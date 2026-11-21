"use client";

import { fxRamp, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Two bright ribbons of energy wave across the middle, crossing and parting. */
export default function EnergySwell({ speed = 1 }: { speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-975", "--em-blue-700", "--em-sky-400", "--em-ink-0"]);
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
              const cy = v - 0.5;
              for (let x = 0; x < s.pw; x++) {
                const u = x / s.ph;
                const cx = u - A / 2;
                const a = Math.exp(-(((cy - 0.12 * Math.sin(cx * 4 - T * 2)) * 14) ** 2));
                const b = Math.exp(-(((cy - 0.08 * Math.sin(cx * 7 + T * 1.5) + 0.03) * 22) ** 2));
                const n = Math.min(1, a * 0.8 + b * 0.6);
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
    [colors, speed],
    { res: 0.25 },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
