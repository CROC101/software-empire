"use client";

import { fxRgb, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/**
 * A ghostly wisp trails the pointer: a short tail of soft puffs that thin out and fade, led by a
 * small bright head. With no pointer the wisp floats on a slow loop.
 */
export default function WispCursor({
  length = 24,
  softness = 26,
}: {
  length?: number;
  softness?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-300", "--em-ink-0"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [r, g, b] = fxRgb(colors[0] ?? "");
        const tail: [number, number][] = [];
        return {
          draw: (t) => {
            const x = s.pointer.on ? s.pointer.x : s.w * (0.5 + 0.32 * Math.cos(t * 0.7));
            const y = s.pointer.on ? s.pointer.y : s.h * (0.5 + 0.25 * Math.sin(t * 1.1));
            const head = tail[0];
            tail.unshift(
              head ? [head[0] + (x - head[0]) * 0.35, head[1] + (y - head[1]) * 0.35] : [x, y],
            );
            tail.length = Math.min(tail.length, length);
            ctx.clearRect(0, 0, s.w, s.h);
            tail.forEach(([px, py], i) => {
              const k = 1 - i / length;
              const rad = softness * (0.4 + k * 0.6);
              // puffs rise a little as they age, like smoke
              const gy = py - i * 0.8;
              const grad = ctx.createRadialGradient(px, gy, 0, px, gy, rad);
              grad.addColorStop(
                0,
                `rgb(${String(r)} ${String(g)} ${String(b)} / ${String(0.16 * k)})`,
              );
              grad.addColorStop(1, `rgb(${String(r)} ${String(g)} ${String(b)} / 0)`);
              ctx.fillStyle = grad;
              ctx.fillRect(px - rad, gy - rad, rad * 2, rad * 2);
            });
            const [hx, hy] = tail[0] ?? [x, y];
            ctx.fillStyle = colors[1] ?? "";
            ctx.beginPath();
            ctx.arc(hx, hy, 3, 0, Math.PI * 2);
            ctx.fill();
          },
        };
      }),
    [colors, length, softness],
    { pointer: true },
  );
  return (
    <div className="relative grid size-full min-h-56 place-items-center overflow-hidden bg-(--em-ink-975)">
      <p className="pointer-events-none text-sm text-(--em-ink-500)">ขยับเมาส์ในกรอบนี้</p>
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
