"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/**
 * A wordmark with current crawling off its edges: short forked arcs jump out from the letters and
 * redraw several times a second. Canvas 2D on the shared clock; reduced motion keeps one frame.
 */
export default function ChargedMark({
  text = "crocwork",
  bolts = 5,
  rate = 11,
}: {
  text?: string;
  bolts?: number;
  rate?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-50", "--em-sky-400", "--em-ink-0"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const family = getComputedStyle(ctx.canvas).fontFamily;
        let next = 0;
        let arcs: [number, number][][] = [];
        const shoot = (size: number, hw: number, hh: number) => {
          const cx = s.w / 2;
          const cy = s.h / 2;
          arcs = Array.from({ length: bolts }, () => {
            const a = Math.random() * Math.PI * 2;
            // start on the box round the word, then walk outwards with a jitter
            let x = cx + Math.cos(a) * hw * (0.6 + Math.random() * 0.4);
            let y = cy + Math.sin(a) * hh;
            const path: [number, number][] = [[x, y]];
            for (let i = 0; i < 7; i++) {
              const d = a + (Math.random() - 0.5) * 1.6;
              x += Math.cos(d) * size * 0.09;
              y += Math.sin(d) * size * 0.09;
              path.push([x, y]);
            }
            return path;
          });
        };
        return {
          draw: (t) => {
            const size = Math.min((s.w * 1.5) / Math.max(text.length, 1), s.h * 0.4);
            ctx.font = `900 ${String(size)}px ${family}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const hw = ctx.measureText(text).width / 2;
            if (t >= next) {
              next = t + 1 / rate;
              shoot(size, hw, size * 0.45);
            }
            ctx.clearRect(0, 0, s.w, s.h);
            ctx.fillStyle = colors[0] ?? "";
            ctx.fillText(text, s.w / 2, s.h / 2);
            ctx.lineJoin = "round";
            for (const [pass, width] of [
              [1, 2],
              [2, 0.75],
            ] as const) {
              ctx.strokeStyle = colors[pass] ?? "";
              ctx.lineWidth = width;
              for (const path of arcs) {
                ctx.globalAlpha = 0.5 + Math.random() * 0.5;
                ctx.beginPath();
                for (const [x, y] of path) ctx.lineTo(x, y);
                ctx.stroke();
              }
            }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, text, bolts, rate],
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas
        ref={ref}
        role="img"
        aria-label={text}
        className="vt-live absolute inset-0 size-full font-heading"
      />
    </div>
  );
}
