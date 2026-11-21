"use client";

import { fxRgb, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

// 4x4 ordered-dither thresholds
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

/**
 * A curtain of dithered dots hangs over the picture and thins out round the pointer, so you look
 * through a hole with a stippled edge. With no pointer the hole drifts on its own.
 */
export default function DitherCurtain({
  radius = 140,
  pixel = 4,
}: {
  radius?: number;
  pixel?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-975"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [r, g, b] = fxRgb(colors[0] ?? "");
        let img = ctx.createImageData(1, 1);
        let hx = 0;
        let hy = 0;
        return {
          resize: () => {
            img = ctx.createImageData(s.pw, s.ph);
          },
          draw: (t) => {
            const tx = s.pointer.on ? s.pointer.x : s.w * (0.5 + 0.3 * Math.sin(t * 0.5));
            const ty = s.pointer.on ? s.pointer.y : s.h * (0.5 + 0.25 * Math.sin(t * 0.8));
            hx += (tx - hx) * 0.15;
            hy += (ty - hy) * 0.15;
            const d = img.data;
            for (let y = 0; y < s.ph; y++)
              for (let x = 0; x < s.pw; x++) {
                const dist = Math.hypot(x / s.k - hx, y / s.k - hy) / radius;
                const veil = Math.min(1, Math.max(0, dist - 0.35)) * 0.95;
                const i = (y * s.pw + x) * 4;
                d[i] = r;
                d[i + 1] = g;
                d[i + 2] = b;
                d[i + 3] = veil > (BAYER[(x & 3) + (y & 3) * 4] ?? 1) ? 255 : 0;
              }
            ctx.putImageData(img, 0, 0);
          },
        };
      }),
    [colors, radius],
    { res: 1 / pixel, pointer: true },
  );
  return (
    <div className="relative grid size-full min-h-72 place-items-center overflow-hidden bg-linear-to-b from-(--em-sky-500) via-(--em-blue-500) to-(--em-blue-700) p-6">
      <p className="font-heading text-5xl font-black text-(--em-ink-0) sm:text-7xl">ใต้ม่านจุด</p>
      <canvas
        ref={ref}
        aria-hidden
        className="vt-live absolute inset-0 size-full [image-rendering:pixelated]"
      />
    </div>
  );
}
