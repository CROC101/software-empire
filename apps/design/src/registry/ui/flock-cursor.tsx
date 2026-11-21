"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

type Mote = { x: number; y: number; vx: number; vy: number; a: number; r: number };

/**
 * A swarm circles the pointer like gnats round a lamp: each mote keeps its own orbit and pace, so
 * the cloud stretches when you move fast and settles into a ring when you stop.
 */
export default function FlockCursor({ count = 80, speed = 1 }: { count?: number; speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-sky-400", "--em-blue-300", "--em-ink-100"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        let motes: Mote[] = [];
        return {
          resize: () => {
            motes = Array.from({ length: count }, () => ({
              x: Math.random() * s.w,
              y: Math.random() * s.h,
              vx: 0,
              vy: 0,
              a: Math.random() * Math.PI * 2,
              r: 14 + Math.random() * 46,
            }));
          },
          draw: (t, dt) => {
            const step = Math.min(dt * 60, 2);
            // idle: drift on a slow figure eight
            const cx = s.pointer.on ? s.pointer.x : s.w * (0.5 + 0.3 * Math.sin(t * 0.6));
            const cy = s.pointer.on ? s.pointer.y : s.h * (0.5 + 0.2 * Math.sin(t * 1.2));
            ctx.clearRect(0, 0, s.w, s.h);
            motes.forEach((m, i) => {
              m.a += 0.03 * speed * step * (i % 2 ? 1 : -1);
              const tx = cx + Math.cos(m.a) * m.r;
              const ty = cy + Math.sin(m.a) * m.r;
              m.vx = (m.vx + (tx - m.x) * 0.012 * speed * step) * 0.92;
              m.vy = (m.vy + (ty - m.y) * 0.012 * speed * step) * 0.92;
              m.x += m.vx * step;
              m.y += m.vy * step;
              ctx.fillStyle = colors[i % colors.length] ?? "";
              ctx.beginPath();
              ctx.arc(m.x, m.y, 1.6, 0, Math.PI * 2);
              ctx.fill();
            });
          },
        };
      }),
    [colors, count, speed],
    { pointer: true },
  );
  return (
    <div className="relative grid size-full min-h-56 place-items-center overflow-hidden bg-(--em-ink-975)">
      <p className="pointer-events-none text-sm text-(--em-ink-500)">ขยับเมาส์ในกรอบนี้</p>
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
