"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

type Knot = { rx: number; ry: number; x: number; y: number; vx: number; vy: number };

/**
 * A net of springs. The pointer pushes the knots aside as it passes and they wobble back into
 * place; knots that are pushed furthest light up. Canvas 2D on the shared clock.
 */
export default function StretchNet({
  spacing = 32,
  stiffness = 0.08,
}: {
  spacing?: number;
  stiffness?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-700", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        let cols = 0;
        let knots: Knot[] = [];
        const reach = spacing * 3;
        return {
          resize: () => {
            cols = Math.ceil(s.w / spacing) + 1;
            const rows = Math.ceil(s.h / spacing) + 1;
            knots = Array.from({ length: cols * rows }, (_, i) => {
              const rx = (i % cols) * spacing;
              const ry = Math.floor(i / cols) * spacing;
              return { rx, ry, x: rx, y: ry, vx: 0, vy: 0 };
            });
          },
          draw: (_t, dt) => {
            const step = Math.min(dt * 60, 2);
            for (const k of knots) {
              let fx = (k.rx - k.x) * stiffness;
              let fy = (k.ry - k.y) * stiffness;
              if (s.pointer.on) {
                const dx = k.x - s.pointer.x;
                const dy = k.y - s.pointer.y;
                const d = Math.hypot(dx, dy) || 1;
                if (d < reach) {
                  const push = ((reach - d) / reach) * 3;
                  fx += (dx / d) * push;
                  fy += (dy / d) * push;
                }
              }
              k.vx = (k.vx + fx * step) * 0.86;
              k.vy = (k.vy + fy * step) * 0.86;
              k.x += k.vx * step;
              k.y += k.vy * step;
            }
            ctx.clearRect(0, 0, s.w, s.h);
            ctx.strokeStyle = colors[0] ?? "";
            ctx.lineWidth = 1;
            ctx.beginPath();
            knots.forEach((k, i) => {
              const right = (i + 1) % cols ? knots[i + 1] : undefined;
              const down = knots[i + cols];
              if (right) {
                ctx.moveTo(k.x, k.y);
                ctx.lineTo(right.x, right.y);
              }
              if (down) {
                ctx.moveTo(k.x, k.y);
                ctx.lineTo(down.x, down.y);
              }
            });
            ctx.stroke();
            ctx.fillStyle = colors[1] ?? "";
            for (const k of knots) {
              const off = Math.hypot(k.x - k.rx, k.y - k.ry);
              if (off < 1) continue;
              ctx.globalAlpha = Math.min(1, off / spacing);
              ctx.fillRect(k.x - 1.5, k.y - 1.5, 3, 3);
            }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, spacing, stiffness],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
