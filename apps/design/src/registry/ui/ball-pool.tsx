"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

type Ball = { x: number; y: number; vx: number; vy: number; r: number; c: number };

/** Balls drop into a pool, bounce and settle; move the pointer through them to stir them up. */
export default function BallPool({
  count = 40,
  gravity = 900,
}: {
  count?: number;
  gravity?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-500", "--em-sky-400", "--em-blue-300", "--em-ink-100"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        let balls: Ball[] = [];
        let px = 0;
        let py = 0;
        return {
          resize: () => {
            const unit = Math.min(s.w, s.h) / 14;
            balls = Array.from({ length: count }, (_, i) => ({
              x: Math.random() * s.w,
              y: -Math.random() * s.h,
              vx: (Math.random() - 0.5) * 100,
              vy: 0,
              r: unit * (0.5 + Math.random() * 0.6),
              c: i % colors.length,
            }));
          },
          draw: (_t, dt) => {
            const step = Math.min(dt, 1 / 30);
            const pvx = step ? (s.pointer.x - px) / step : 0;
            const pvy = step ? (s.pointer.y - py) / step : 0;
            px = s.pointer.x;
            py = s.pointer.y;
            for (const b of balls) {
              b.vy += gravity * step;
              b.vx *= 0.995;
              if (s.pointer.on) {
                const d = Math.hypot(b.x - px, b.y - py);
                if (d < b.r * 2) {
                  b.vx += pvx * 0.08;
                  b.vy += pvy * 0.08;
                }
              }
              b.x += b.vx * step;
              b.y += b.vy * step;
              if (b.x < b.r) [b.x, b.vx] = [b.r, Math.abs(b.vx) * 0.7];
              if (b.x > s.w - b.r) [b.x, b.vx] = [s.w - b.r, -Math.abs(b.vx) * 0.7];
              if (b.y > s.h - b.r) [b.y, b.vy] = [s.h - b.r, -Math.abs(b.vy) * 0.5];
            }
            // pairwise push-apart; count is small so n^2 is fine
            for (let i = 0; i < balls.length; i++)
              for (let j = i + 1; j < balls.length; j++) {
                const a = balls[i];
                const b = balls[j];
                if (!a || !b) continue;
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const d = Math.hypot(dx, dy) || 1;
                const overlap = a.r + b.r - d;
                if (overlap <= 0) continue;
                const nx = dx / d;
                const ny = dy / d;
                a.x -= (nx * overlap) / 2;
                a.y -= (ny * overlap) / 2;
                b.x += (nx * overlap) / 2;
                b.y += (ny * overlap) / 2;
                const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
                if (rel < 0) {
                  a.vx += rel * nx * 0.9;
                  a.vy += rel * ny * 0.9;
                  b.vx -= rel * nx * 0.9;
                  b.vy -= rel * ny * 0.9;
                }
              }
            ctx.clearRect(0, 0, s.w, s.h);
            for (const b of balls) {
              ctx.fillStyle = colors[b.c] ?? "#fff";
              ctx.beginPath();
              ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
              ctx.fill();
            }
          },
        };
      }),
    [colors, count, gravity],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
