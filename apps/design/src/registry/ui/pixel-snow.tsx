"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

type Flake = { x: number; y: number; v: number; size: number; phase: number };

/** Square snowflakes on a pixel grid, near ones big and quick, far ones small and slow, drifting with a breeze. */
export default function PixelSnow({
  count = 160,
  pixel = 3,
  wind = 0.4,
}: {
  count?: number;
  pixel?: number;
  wind?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-50", "--em-sky-400", "--em-blue-300"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        let flakes: Flake[] = [];
        return {
          resize: () => {
            flakes = Array.from({ length: count }, () => {
              const near = Math.random();
              return {
                x: Math.random() * s.w,
                y: Math.random() * s.h,
                v: 15 + near * 50,
                size: pixel * (1 + Math.round(near * 2)),
                phase: Math.random() * 6,
              };
            });
          },
          draw: (t, dt) => {
            ctx.clearRect(0, 0, s.w, s.h);
            flakes.forEach((f, i) => {
              f.y += f.v * dt;
              f.x += (wind * 30 + Math.sin(t + f.phase) * 12) * dt * (f.v / 40);
              if (f.y > s.h) [f.y, f.x] = [-f.size, Math.random() * s.w];
              if (f.x > s.w) f.x -= s.w;
              if (f.x < 0) f.x += s.w;
              ctx.fillStyle = colors[i % colors.length] ?? "#fff";
              ctx.globalAlpha = 0.4 + (f.v / 65) * 0.6;
              // snap to the pixel grid so flakes step like an old screen
              ctx.fillRect(
                Math.round(f.x / pixel) * pixel,
                Math.round(f.y / pixel) * pixel,
                f.size,
                f.size,
              );
            });
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, count, pixel, wind],
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
