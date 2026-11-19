"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A grid of lines lifted by a ring wave from the centre; tap to drop a second wave where you touched. */
export default function RippleMesh({ gap = 24, speed = 1 }: { gap?: number; speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-400", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [line = "#fff", crest = "#fff"] = colors;
        let drop = { x: 0, y: 0, at: -99 };
        const lift = (x: number, y: number, t: number) => {
          const d = Math.hypot(x - s.w / 2, y - s.h / 2);
          let z = Math.sin(d * 0.04 - t * 2.2 * speed) * Math.exp(-d * 0.004);
          const age = t - drop.at;
          if (age < 3) {
            const e = Math.hypot(x - drop.x, y - drop.y);
            z +=
              Math.sin(e * 0.08 - age * 8) *
              Math.exp(-Math.abs(e - age * 200) * 0.02) *
              (1 - age / 3);
          }
          return z;
        };
        const strand = (pts: [number, number][], t: number) => {
          ctx.beginPath();
          pts.forEach(([x, y], i) => {
            const z = lift(x, y, t);
            if (i) ctx.lineTo(x, y - z * 8);
            else ctx.moveTo(x, y - z * 8);
          });
          ctx.stroke();
        };
        return {
          draw: (t) => {
            if (s.pointer.down === 0) drop = { x: s.pointer.x, y: s.pointer.y, at: t };
            ctx.clearRect(0, 0, s.w, s.h);
            ctx.lineWidth = 1;
            for (let y = gap / 2; y < s.h; y += gap) {
              ctx.strokeStyle = Math.abs(lift(s.w / 2, y, t)) > 0.6 ? crest : line;
              ctx.globalAlpha = 0.45;
              const row: [number, number][] = [];
              for (let x = 0; x <= s.w + gap; x += gap / 2) row.push([x, y]);
              strand(row, t);
            }
            for (let x = gap / 2; x < s.w; x += gap) {
              ctx.strokeStyle = line;
              ctx.globalAlpha = 0.25;
              const col: [number, number][] = [];
              for (let y = 0; y <= s.h + gap; y += gap / 2) col.push([x, y]);
              strand(col, t);
            }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, gap, speed],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
