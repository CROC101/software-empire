"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+-=<>/";
const pickGlyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0] ?? "#";

/** A wall of letters where a few cells change each frame; only the changed cells are redrawn. */
export default function GlyphGlitch({ cell = 16, rate = 0.04 }: { cell?: number; rate?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-975", "--em-blue-700", "--em-blue-400", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [bg = "#000", ...ink] = colors;
        let cols = 0;
        let rows = 0;
        let tone: Uint8Array = new Uint8Array(0);
        const paint = (i: number) => {
          const x = (i % cols) * cell;
          const y = Math.floor(i / cols) * cell;
          ctx.fillStyle = bg;
          ctx.fillRect(x, y, cell, cell);
          ctx.fillStyle = ink[tone[i] ?? 0] ?? "#fff";
          ctx.fillText(pickGlyph(), x + cell / 2, y + cell / 2);
        };
        return {
          resize: () => {
            cols = Math.ceil(s.w / cell);
            rows = Math.ceil(s.h / cell);
            tone = Uint8Array.from({ length: cols * rows }, () => (Math.random() < 0.9 ? 0 : 1));
            ctx.font = `${Math.round(cell * 0.75)}px ui-monospace, monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            for (let i = 0; i < cols * rows; i++) paint(i);
          },
          draw: () => {
            const n = Math.ceil(cols * rows * rate);
            for (let k = 0; k < n; k++) {
              const i = (Math.random() * cols * rows) | 0;
              tone[i] = Math.random() < 0.85 ? 0 : Math.random() < 0.7 ? 1 : 2;
              paint(i);
            }
          },
        };
      }),
    [colors, cell, rate],
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
