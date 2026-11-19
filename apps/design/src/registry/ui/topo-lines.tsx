"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Contour lines of a slowly shifting landscape, traced with marching squares on a coarse grid. */
export default function TopoLines({
  levels = 9,
  speed = 0.15,
  cell = 14,
}: {
  levels?: number;
  speed?: number;
  cell?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-500", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [line = "#fff", major = "#fff"] = colors;
        let cols = 0;
        let rows = 0;
        let field = new Float32Array(0);
        return {
          resize: () => {
            cols = Math.ceil(s.w / cell) + 1;
            rows = Math.ceil(s.h / cell) + 1;
            field = new Float32Array(cols * rows);
          },
          draw: (t) => {
            const T = t * speed;
            for (let j = 0; j < rows; j++)
              for (let i = 0; i < cols; i++) {
                const u = (i * cell) / 180;
                const v = (j * cell) / 180;
                field[j * cols + i] =
                  (Math.sin(u + T) * Math.cos(v * 0.8 - T * 0.7) +
                    0.5 * Math.sin(u * 2.1 - v * 1.3 + T * 1.3) +
                    0.25 * Math.cos(u * 3.7 + v * 2.9 - T)) /
                  1.75;
              }
            ctx.clearRect(0, 0, s.w, s.h);
            ctx.lineWidth = 1;
            for (let l = 0; l < levels; l++) {
              const iso = -0.9 + (1.8 * (l + 0.5)) / levels;
              ctx.strokeStyle = l % 3 === 1 ? major : line;
              ctx.globalAlpha = l % 3 === 1 ? 0.8 : 0.4;
              ctx.beginPath();
              for (let j = 0; j < rows - 1; j++)
                for (let i = 0; i < cols - 1; i++) {
                  const a = field[j * cols + i] ?? 0;
                  const b = field[j * cols + i + 1] ?? 0;
                  const c = field[(j + 1) * cols + i + 1] ?? 0;
                  const d = field[(j + 1) * cols + i] ?? 0;
                  const x = i * cell;
                  const y = j * cell;
                  // where the level crosses each edge of this cell
                  const hits: number[] = [];
                  const edge = (
                    p: number,
                    q: number,
                    x0: number,
                    y0: number,
                    x1: number,
                    y1: number,
                  ) => {
                    if (p < iso === q < iso) return;
                    const f = (iso - p) / (q - p);
                    hits.push(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f);
                  };
                  edge(a, b, x, y, x + cell, y);
                  edge(b, c, x + cell, y, x + cell, y + cell);
                  edge(c, d, x + cell, y + cell, x, y + cell);
                  edge(d, a, x, y + cell, x, y);
                  for (let k = 0; k + 3 < hits.length; k += 4) {
                    ctx.moveTo(hits[k] ?? 0, hits[k + 1] ?? 0);
                    ctx.lineTo(hits[k + 2] ?? 0, hits[k + 3] ?? 0);
                  }
                }
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, levels, speed, cell],
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
