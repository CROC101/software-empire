"use client";

import { fxRamp, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A mosaic of square tiles; a foil shimmer rolls across them diagonally, each tile catching it a little differently. */
export default function FoilTiles({ speed = 0.6, cells = 12 }: { speed?: number; cells?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-900", "--em-blue-600", "--em-sky-400", "--em-ink-100"]);
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
            let o = 0;
            for (let y = 0; y < s.ph; y++) {
              const v = y / s.ph;
              for (let x = 0; x < s.pw; x++) {
                const u = x / s.ph;
                const gx = Math.floor(u * cells);
                const gy = Math.floor(v * cells);
                const r = Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453;
                const k = r - Math.floor(r);
                const seam = Math.min((u * cells) % 1, (v * cells) % 1) < 0.08 ? 0.12 : 0;
                const n =
                  0.15 +
                  0.7 * (0.5 + 0.5 * Math.sin((gx + gy) * 0.5 - T * 2 + k * 2)) * (0.6 + 0.4 * k) -
                  seam;
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
    [colors, speed, cells],
    { res: 0.25 },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
