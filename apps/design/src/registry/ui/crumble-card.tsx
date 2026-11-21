"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

type Bit = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; c: number };

/** A poster made of small blocks; the pointer pushes them loose like crumbling plaster, and they drift back into place. */
export default function CrumbleCard({ force = 1 }: { force?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-700", "--em-blue-500", "--em-sky-400", "--em-ink-0"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        let bits: Bit[] = [];
        let cell = 8;
        return {
          resize: () => {
            const cw = Math.min(220, s.w * 0.6);
            const ch = cw * 1.3;
            cell = Math.max(6, Math.round(cw / 24));
            const ox = (s.w - cw) / 2;
            const oy = (s.h - ch) / 2;
            bits = [];
            for (let y = 0; y < ch; y += cell)
              for (let x = 0; x < cw; x += cell) {
                // a calm water band across the poster: deeper blue low down, a pale stripe as the horizon
                const band = y / ch;
                const c = Math.abs(band - 0.35) < 0.03 ? 3 : band > 0.55 ? 0 : band > 0.38 ? 1 : 2;
                bits.push({ hx: ox + x, hy: oy + y, x: ox + x, y: oy + y, vx: 0, vy: 0, c });
              }
          },
          draw: (_t, dt) => {
            const k = Math.min(dt, 1 / 30);
            ctx.clearRect(0, 0, s.w, s.h);
            for (const b of bits) {
              if (s.pointer.on) {
                const dx = b.x - s.pointer.x;
                const dy = b.y - s.pointer.y;
                const d = Math.hypot(dx, dy) || 1;
                if (d < 50) {
                  b.vx += (dx / d) * 900 * force * k;
                  b.vy += (dy / d) * 900 * force * k;
                }
              }
              b.vx += (b.hx - b.x) * 6 * k;
              b.vy += (b.hy - b.y) * 6 * k;
              b.vx *= 0.9;
              b.vy *= 0.9;
              b.x += b.vx * k * 10;
              b.y += b.vy * k * 10;
              ctx.fillStyle = colors[b.c] ?? "";
              ctx.fillRect(b.x, b.y, cell - 1, cell - 1);
            }
          },
        };
      }),
    [colors, force],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-80 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
