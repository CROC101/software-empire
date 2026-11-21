"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Tiles riding a turning coil, rising forever; the near side is bright, the far side sinks into the dark. */
export default function CoilPath({ turns = 3, speed = 1 }: { turns?: number; speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-600", "--em-blue-500", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => ({
        draw: (t) => {
          const n = 48;
          const tiles = Array.from({ length: n }, (_, k) => {
            const u = (k / n + t * 0.03 * speed) % 1;
            const a = u * turns * Math.PI * 2;
            return { u, z: Math.sin(a), x: s.w / 2 + Math.cos(a) * s.w * 0.28 };
          }).sort((p, q) => p.z - q.z);
          ctx.clearRect(0, 0, s.w, s.h);
          for (const p of tiles) {
            const size = 8 + (p.z + 1) * 9;
            const y = s.h * 0.1 + (1 - p.u) * s.h * 0.8;
            ctx.globalAlpha = 0.2 + (p.z + 1) * 0.4;
            ctx.fillStyle = (p.z > 0.6 ? colors[2] : p.z > 0 ? colors[1] : colors[0]) ?? "";
            ctx.fillRect(p.x - size / 2, y - size / 2, size, size);
          }
          ctx.globalAlpha = 1;
        },
      })),
    [colors, turns, speed],
  );
  return (
    <div className="relative size-full min-h-72 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
