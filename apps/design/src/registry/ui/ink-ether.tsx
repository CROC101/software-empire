"use client";

import { fxRamp, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Swirling ink in deep water, folded by two slow currents; the pointer stirs a local eddy. */
export default function InkEther({ speed = 0.5 }: { speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-975", "--em-blue-900", "--em-blue-600", "--em-sky-400"]);
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
            let o = 0;
            for (let y = 0; y < s.ph; y++) {
              const v = y / s.ph;
              for (let x = 0; x < s.pw; x++) {
                const u = x / s.ph;
                const dx = u - px;
                const dy = v - py;
                const swirl = 0.6 * Math.exp(-(dx * dx + dy * dy) * 12);
                const wu = u + 0.3 * Math.sin(v * 3 + T) + swirl * Math.sin(T * 2);
                const wv = v + 0.3 * Math.cos(u * 2.5 - T * 0.8) + swirl * Math.cos(T * 2);
                const n = 0.5 + 0.5 * Math.sin(wu * 4 + Math.sin(wv * 3 + T) * 1.5);
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
    { res: 0.18, pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
