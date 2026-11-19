"use client";

import { useRef, useState } from "react";

const COLS = 14;
const ROWS = 9;
const GAP = 26;

/** A grid of dots that lean toward the pointer inside a radius and swell the closer they are. */
export default function MagnetDots({ radius = 140 }: { radius?: number }) {
  const r = Math.min(240, Math.max(60, radius));
  const [p, setP] = useState<{ x: number; y: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  return (
    <div className="grid size-full min-h-72 place-items-center overflow-hidden bg-(--em-ink-975) p-6">
      <div
        ref={box}
        aria-hidden
        onPointerMove={(e) => {
          const b = box.current?.getBoundingClientRect();
          if (b) setP({ x: e.clientX - b.left, y: e.clientY - b.top });
        }}
        onPointerLeave={() => {
          setP(null);
        }}
        className="relative touch-none"
        style={{ width: COLS * GAP, height: ROWS * GAP }}
      >
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const cx = (i % COLS) * GAP + GAP / 2;
          const cy = Math.floor(i / COLS) * GAP + GAP / 2;
          let tx = 0;
          let ty = 0;
          let s = 1;
          if (p) {
            const dx = p.x - cx;
            const dy = p.y - cy;
            const d = Math.hypot(dx, dy);
            if (d < r) {
              const k = 1 - d / r;
              tx = dx * k * 0.35;
              ty = dy * k * 0.35;
              s = 1 + k * 1.6;
            }
          }
          return (
            <span
              key={i}
              className="absolute size-1.5 rounded-full bg-(--em-sky-400) transition-transform duration-150 ease-out motion-reduce:transition-none"
              style={{
                left: cx - 3,
                top: cy - 3,
                transform: `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s.toFixed(2)})`,
                opacity: 0.35 + (s - 1) * 0.4,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
