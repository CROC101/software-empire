"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

type P = { x: number; y: number; z: number };

/** A sphere of points turning slowly in 3D; the pointer tilts it, nearer points are bigger and brighter. */
export default function FloatParticles({
  count = 500,
  speed = 0.3,
}: {
  count?: number;
  speed?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-sky-400", "--em-blue-300", "--em-ink-100"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const pts: P[] = Array.from({ length: count }, () => {
          const u = Math.random() * 2 - 1;
          const a = Math.random() * Math.PI * 2;
          const r = Math.cbrt(Math.random());
          const q = Math.sqrt(1 - u * u) * r;
          return { x: Math.cos(a) * q, y: u * r, z: Math.sin(a) * q };
        });
        let tilt = 0;
        return {
          draw: (t, dt) => {
            ctx.clearRect(0, 0, s.w, s.h);
            const want = s.pointer.on ? (s.pointer.y / s.h - 0.5) * 1.2 : 0.35;
            tilt += (want - tilt) * Math.min(1, dt * 4);
            const yaw = t * speed + (s.pointer.on ? (s.pointer.x / s.w - 0.5) * 1.5 : 0);
            const cy = Math.cos(yaw);
            const sy = Math.sin(yaw);
            const cx = Math.cos(tilt);
            const sx = Math.sin(tilt);
            const R = Math.min(s.w, s.h) * 0.42;
            pts.forEach((p, i) => {
              const x = p.x * cy - p.z * sy;
              const z1 = p.x * sy + p.z * cy;
              const y = p.y * cx - z1 * sx;
              const z = p.y * sx + z1 * cx;
              const depth = 1 / (2.2 - z);
              const size = 0.6 + depth * 2.4;
              ctx.globalAlpha = 0.2 + depth * 0.8;
              ctx.fillStyle = colors[i % colors.length] ?? "#fff";
              ctx.fillRect(
                s.w / 2 + x * R * depth * 1.6,
                s.h / 2 + y * R * depth * 1.6,
                size,
                size,
              );
            });
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, count, speed],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
