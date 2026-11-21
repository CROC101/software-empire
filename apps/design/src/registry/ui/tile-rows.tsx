"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Rows of tiles slide in alternate directions; moving the pointer sideways pushes the rows along. */
export default function TileRows({ speed = 1, rows = 5 }: { speed?: number; rows?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-800", "--em-blue-700", "--em-ink-700"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = "", c2 = ""] = colors;
        return {
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            const rh = s.h / rows;
            const w = rh * 1.4;
            const P = w * 3;
            const shift = s.pointer.on ? (s.pointer.x / s.w - 0.5) * w * 2 : 0;
            const tones = [c0, c1, c2];
            for (let r = 0; r < rows; r++) {
              const dir = r % 2 === 0 ? 1 : -1;
              const off = ((((T * 30 + shift) * dir) % P) + P) % P;
              for (let i = 0; -P + off + i * w < s.w + w; i++) {
                ctx.fillStyle = tones[(i + r * 2) % 3] ?? c0;
                ctx.fillRect(-P + off + i * w + 4, r * rh + 4, w - 8, rh - 8);
              }
            }
          },
        };
      }),
    [colors, speed, rows],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
