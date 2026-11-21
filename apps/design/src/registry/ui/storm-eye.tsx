"use client";

import { fxRamp, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A burning iris of light around a slit pupil; the pupil turns to watch the pointer. */
export default function StormEye({ speed = 0.6 }: { speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors([
    "--em-ink-975",
    "--em-blue-800",
    "--em-blue-500",
    "--em-sky-400",
    "--em-ink-0",
  ]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const ramp = fxRamp(colors);
        let img = ctx.createImageData(1, 1);
        let lx = 0;
        let ly = 0;
        return {
          resize: () => {
            img = ctx.createImageData(s.pw, s.ph);
          },
          draw: (t) => {
            const d = img.data;
            const T = t * speed;
            const A = s.pw / s.ph;
            // the pupil eases toward the pointer, kept inside the iris
            const tx = s.pointer.on
              ? Math.max(-0.07, Math.min(0.07, (s.pointer.x / s.h - A / 2) * 0.15))
              : 0;
            const ty = s.pointer.on
              ? Math.max(-0.04, Math.min(0.04, (s.pointer.y / s.h - 0.5) * 0.15))
              : 0;
            lx += (tx - lx) * 0.08;
            ly += (ty - ly) * 0.08;
            let o = 0;
            for (let y = 0; y < s.ph; y++) {
              const cy = y / s.ph - 0.5;
              for (let x = 0; x < s.pw; x++) {
                const cx = (x / s.ph - A / 2) / 1.7;
                const a = Math.atan2(cy, cx);
                const st =
                  (0.5 + 0.5 * Math.sin(a * 23 + Math.sin(a * 5 + T) * 3 + T * 0.6)) *
                  (0.5 + 0.5 * Math.sin(a * 37 - T * 1.3));
                const q = Math.hypot(cx, cy) / 0.3 / (0.8 + 0.4 * st);
                let n =
                  q < 1
                    ? Math.sqrt(1 - q) * (0.55 + 0.45 * st) * (q < 0.3 ? 0.55 + q * 1.5 : 1)
                    : Math.max(0, 0.25 - (q - 1) * 0.8) * st;
                const sx = (x / s.ph - A / 2 - lx) / 0.035;
                const sy = (cy - ly) / 0.2;
                if (sy * sy < 1 && Math.abs(sx) < 1 - sy * sy) n *= 0.05;
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
    { res: 0.25, pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
