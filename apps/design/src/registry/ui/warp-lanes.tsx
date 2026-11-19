"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

type Streak = { x: number; y: number; z: number };

/** Light streaks rushing past the camera; hold the pointer down to go faster. */
export default function WarpLanes({
  speed = 0.5,
  count = 220,
}: {
  speed?: number;
  count?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-sky-400", "--em-blue-400", "--em-ink-50"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const spawn = (z = 1): Streak => {
          const a = Math.random() * Math.PI * 2;
          const r = 0.15 + Math.random() * 0.85;
          return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.6, z };
        };
        const list = Array.from({ length: count }, () => spawn(Math.random()));
        let boost = 1;
        return {
          draw: (_t, dt) => {
            ctx.clearRect(0, 0, s.w, s.h);
            boost += ((s.pointer.down >= 0 && s.pointer.on ? 4 : 1) - boost) * Math.min(1, dt * 3);
            const scale = Math.max(s.w, s.h) * 0.35;
            const cx = s.w / 2;
            const cy = s.h / 2;
            const step = dt * speed * boost;
            ctx.lineCap = "round";
            list.forEach((p, i) => {
              p.z -= step;
              if (p.z < 0.03) Object.assign(p, spawn());
              const tail = p.z + 0.04 * boost;
              ctx.strokeStyle = colors[i % colors.length] ?? "#fff";
              ctx.globalAlpha = Math.min(1, (1 - p.z) * 1.4);
              ctx.lineWidth = 1 + (1 - p.z) * 1.5;
              ctx.beginPath();
              ctx.moveTo(cx + (p.x / tail) * scale, cy + (p.y / tail) * scale);
              ctx.lineTo(cx + (p.x / p.z) * scale, cy + (p.y / p.z) * scale);
              ctx.stroke();
            });
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, speed, count],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
