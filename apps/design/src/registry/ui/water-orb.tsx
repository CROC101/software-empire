"use client";

import { fxRamp, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A glowing sphere of water with currents turning inside; its edge wobbles when the pointer comes close. */
export default function WaterOrb({ speed = 0.6 }: { speed?: number }) {
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
        return {
          resize: () => {
            img = ctx.createImageData(s.pw, s.ph);
          },
          draw: (t) => {
            const d = img.data;
            const T = t * speed;
            const A = s.pw / s.ph;
            const px = s.pointer.on ? s.pointer.x / s.h : A / 2;
            const py = s.pointer.on ? s.pointer.y / s.h : 0.5;
            const near = s.pointer.on ? Math.exp(-((px - A / 2) ** 2 + (py - 0.5) ** 2) * 8) : 0;
            let o = 0;
            for (let y = 0; y < s.ph; y++) {
              const v = y / s.ph;
              const cy = v - 0.5;
              for (let x = 0; x < s.pw; x++) {
                const u = x / s.ph;
                const cx = u - A / 2;
                const r =
                  Math.hypot(cx, cy) /
                  (0.3 + 0.03 * near * Math.sin(Math.atan2(cy, cx) * 6 + T * 5));
                const swirl = 0.5 + 0.5 * Math.sin(cx * 9 + Math.sin(cy * 7 + T) * 2 + T * 1.5);
                const n =
                  r < 1
                    ? (0.35 + 0.55 * swirl) * (1 - r * r * 0.5) + (r > 0.92 ? 0.3 : 0)
                    : Math.max(0, 0.3 - (r - 1) * 1.2) * 0.6;
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
