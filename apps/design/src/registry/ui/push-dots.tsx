"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A field of dots that the pointer pushes aside; each springs back to its place. */
export default function PushDots({ gap = 22, force = 1 }: { gap?: number; force?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-500", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = ""] = colors;
        let dots: { x: number; y: number; ox: number; oy: number; vx: number; vy: number }[] = [];
        return {
          resize: () => {
            dots = [];
            for (let y = gap / 2; y < s.h; y += gap)
              for (let x = gap / 2; x < s.w; x += gap)
                dots.push({ x, y, ox: x, oy: y, vx: 0, vy: 0 });
          },
          draw: (_t, dt) => {
            const k = Math.min(dt, 1 / 30);
            const damp = Math.exp(-10 * k);
            ctx.clearRect(0, 0, s.w, s.h);
            for (const p of dots) {
              let ax = (p.ox - p.x) * 120;
              let ay = (p.oy - p.y) * 120;
              if (s.pointer.on) {
                const dx = p.x - s.pointer.x;
                const dy = p.y - s.pointer.y;
                const d = Math.hypot(dx, dy) + 0.01;
                const f = Math.max(0, 1 - d / 120) * force * 9000;
                ax += (dx / d) * f;
                ay += (dy / d) * f;
              }
              p.vx = (p.vx + ax * k) * damp;
              p.vy = (p.vy + ay * k) * damp;
              p.x += p.vx * k;
              p.y += p.vy * k;
              const moved = Math.min(1, Math.hypot(p.x - p.ox, p.y - p.oy) / 20);
              ctx.globalAlpha = 0.35 + moved * 0.65;
              ctx.fillStyle = moved > 0.3 ? c1 : c0;
              ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
            }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, gap, force],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas
        ref={ref}
        role="img"
        aria-label="ตารางจุด เลื่อนเมาส์เพื่อดันจุดออก"
        className="vt-live absolute inset-0 size-full"
      />
    </div>
  );
}
