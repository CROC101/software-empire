"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

type Cell = { side: number; due: number };

/**
 * Two pictures share one frame. Point at it and the day scene swaps to night block by block in a
 * random order; leave and it swaps back the same way. Tap does the same on touch screens.
 */
export default function PixelShuffle({
  blocks = 12,
  spread = 0.6,
}: {
  blocks?: number;
  spread?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors([
    "--em-sky-400",
    "--em-blue-500",
    "--em-ink-0",
    "--em-ink-975",
    "--em-blue-800",
    "--em-ink-100",
  ]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [sky, sea, sun, night, deep, moon] = colors;
        const pics = [document.createElement("canvas"), document.createElement("canvas")];
        let cells: Cell[] = [];
        let want = 0;
        let flip = false;
        const paint = (c: HTMLCanvasElement, top = "", low = "", orb = "", stars = false) => {
          const g = c.getContext("2d");
          if (!g) return;
          c.width = s.pw;
          c.height = s.ph;
          g.scale(s.k, s.k);
          const grad = g.createLinearGradient(0, 0, 0, s.h);
          grad.addColorStop(0, top);
          grad.addColorStop(1, low);
          g.fillStyle = grad;
          g.fillRect(0, 0, s.w, s.h);
          g.fillStyle = orb;
          g.beginPath();
          g.arc(s.w * 0.72, s.h * 0.3, Math.min(s.w, s.h) * 0.12, 0, Math.PI * 2);
          g.fill();
          if (stars)
            for (let i = 0; i < 40; i++)
              g.fillRect(Math.random() * s.w, Math.random() * s.h * 0.6, 1.5, 1.5);
          g.fillStyle = low;
          g.fillRect(0, s.h * 0.72, s.w, s.h);
        };
        return {
          resize: () => {
            const [day, dark] = pics;
            if (day) paint(day, sky, sea, sun);
            if (dark) paint(dark, night, deep, moon, true);
            cells = Array.from({ length: blocks * blocks }, () => ({ side: want, due: 0 }));
          },
          draw: (t) => {
            if (s.pointer.down === 0) flip = !flip;
            const next = (s.pointer.on ? 1 : 0) ^ (flip ? 1 : 0);
            if (next !== want) {
              want = next;
              for (const c of cells) c.due = t + Math.random() * spread;
            }
            const cw = s.w / blocks;
            const ch = s.h / blocks;
            cells.forEach((c, i) => {
              if (c.side !== want && t >= c.due) c.side = want;
              const pic = pics[c.side];
              if (!pic) return;
              const x = (i % blocks) * cw;
              const y = Math.floor(i / blocks) * ch;
              ctx.drawImage(pic, x * s.k, y * s.k, cw * s.k, ch * s.k, x, y, cw, ch);
            });
          },
        };
      }),
    [colors, blocks, spread],
    { pointer: true },
  );
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <div className="relative aspect-4/3 w-full max-w-md overflow-hidden rounded-xl">
        <canvas
          ref={ref}
          role="img"
          aria-label="ภาพทะเลกลางวันสลับเป็นกลางคืนทีละช่อง"
          className="vt-live absolute inset-0 size-full"
        />
      </div>
    </div>
  );
}
