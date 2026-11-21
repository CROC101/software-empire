"use client";

import { fxRamp, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A chunky pixel swirl that winds tighter toward the centre and keeps turning. */
export default function PixelSwirl({ speed = 0.4 }: { speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-975", "--em-blue-800", "--em-blue-500", "--em-sky-400"]);
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
                const r = Math.hypot(cx, cy);
                const a = Math.atan2(cy, cx) + r * 4 - T;
                const n = 0.5 + 0.5 * Math.sin(a * 3 + Math.sin(r * 12 - T * 2) * 1.5);
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
    { res: 0.08 },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
