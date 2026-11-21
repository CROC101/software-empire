"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/**
 * The pointer leaves a trail of square blocks on a hidden grid; each block lights at full strength
 * and fades on its own. Gaps between fast moves are filled so the trail never breaks.
 */
export default function BlockTrail({ cell = 20, fade = 0.8 }: { cell?: number; fade?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const lit = new Map<number, number>();
        let cols = 1;
        let last: [number, number] | null = null;
        const light = (x: number, y: number) => {
          const c = Math.floor(x / cell);
          const r = Math.floor(y / cell);
          if (c >= 0 && r >= 0 && c < cols) lit.set(r * cols + c, 1);
        };
        return {
          resize: () => {
            cols = Math.ceil(s.w / cell);
            lit.clear();
          },
          draw: (_t, dt) => {
            if (s.pointer.on) {
              const { x, y } = s.pointer;
              const [lx, ly] = last ?? [x, y];
              const n = Math.ceil(Math.hypot(x - lx, y - ly) / (cell / 2)) || 1;
              for (let i = 1; i <= n; i++) light(lx + ((x - lx) * i) / n, ly + ((y - ly) * i) / n);
              last = [x, y];
            } else last = null;
            ctx.clearRect(0, 0, s.w, s.h);
            ctx.fillStyle = colors[0] ?? "";
            for (const [i, a] of lit) {
              const left = a - dt / fade;
              if (left <= 0) {
                lit.delete(i);
                continue;
              }
              lit.set(i, left);
              ctx.globalAlpha = left;
              ctx.fillRect(
                (i % cols) * cell + 1,
                Math.floor(i / cols) * cell + 1,
                cell - 2,
                cell - 2,
              );
            }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, cell, fade],
    { pointer: true },
  );
  return (
    <div className="relative grid size-full min-h-56 place-items-center overflow-hidden bg-(--em-ink-975)">
      <p className="pointer-events-none text-sm text-(--em-ink-500)">ลากเมาส์ผ่านกรอบนี้</p>
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
