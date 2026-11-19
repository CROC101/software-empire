"use client";

import { fxRgb, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

// 4x4 ordered-dither thresholds, 0..1
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

/** Rolling swells drawn with two inks and an ordered-dither pattern, like an old one-bit screen. */
export default function DitherTide({ pixel = 4, speed = 0.6 }: { pixel?: number; speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-975", "--em-blue-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [off, on] = colors.map(fxRgb);
        let img = ctx.createImageData(1, 1);
        return {
          resize: () => {
            img = ctx.createImageData(s.pw, s.ph);
          },
          draw: (t) => {
            const d = img.data;
            const T = t * speed;
            let o = 0;
            for (let y = 0; y < s.ph; y++) {
              const v = y / s.ph;
              for (let x = 0; x < s.pw; x++) {
                const u = x / s.pw;
                const wave =
                  0.55 +
                  0.12 * Math.sin(u * 7 + T) +
                  0.06 * Math.sin(u * 17 - T * 1.7) +
                  0.05 * Math.sin(u * 3 + T * 0.4);
                const lum =
                  Math.min(1, Math.max(0, (v - wave + 0.35) * 1.6)) *
                  (0.6 + 0.4 * Math.sin(u * 4 - T * 0.5));
                const c = lum > (BAYER[(y & 3) * 4 + (x & 3)] ?? 0.5) ? on : off;
                d[o] = c?.[0] ?? 0;
                d[o + 1] = c?.[1] ?? 0;
                d[o + 2] = c?.[2] ?? 0;
                d[o + 3] = 255;
                o += 4;
              }
            }
            ctx.putImageData(img, 0, 0);
          },
        };
      }),
    [colors, speed],
    { res: 1 / Math.max(1, pixel) },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas
        ref={ref}
        aria-hidden
        className="vt-live absolute inset-0 size-full [image-rendering:pixelated]"
      />
    </div>
  );
}
