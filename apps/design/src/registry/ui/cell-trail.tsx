"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A grid of cells that light up under the pointer and fade slowly, leaving a trail. */
export default function CellTrail({ size = 36 }: { size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-800", "--em-blue-500"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = ""] = colors;
        let heat = new Float32Array(0);
        let cols = 0;
        let rows = 0;
        return {
          resize: () => {
            cols = Math.ceil(s.w / size);
            rows = Math.ceil(s.h / size);
            heat = new Float32Array(cols * rows);
          },
          draw: (_t, dt) => {
            if (s.pointer.on) {
              const i = Math.floor(s.pointer.x / size);
              const j = Math.floor(s.pointer.y / size);
              if (i >= 0 && i < cols && j >= 0 && j < rows) heat[j * cols + i] = 1;
            }
            const fade = Math.exp(-dt * 1.5);
            ctx.clearRect(0, 0, s.w, s.h);
            ctx.lineWidth = 1;
            ctx.strokeStyle = c0;
            ctx.fillStyle = c1;
            for (let j = 0; j < rows; j++)
              for (let i = 0; i < cols; i++) {
                const k = j * cols + i;
                const e = (heat[k] ?? 0) * fade;
                heat[k] = e;
                ctx.globalAlpha = 0.5;
                ctx.strokeRect(i * size + 0.5, j * size + 0.5, size - 1, size - 1);
                if (e > 0.01) {
                  ctx.globalAlpha = e;
                  ctx.fillRect(i * size + 2, j * size + 2, size - 4, size - 4);
                }
              }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, size],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas
        ref={ref}
        role="img"
        aria-label="ตารางช่อง เลื่อนเมาส์แล้วช่องสว่างเป็นทาง"
        className="vt-live absolute inset-0 size-full"
      />
    </div>
  );
}
