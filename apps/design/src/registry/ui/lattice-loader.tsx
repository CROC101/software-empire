"use client";

import { motion } from "motion/react";

/** A loader made of a small square grid; a wave of light runs corner to corner through it. */
export default function LatticeLoader({ size = 3, speed = 1 }: { size?: number; speed?: number }) {
  const d = 1.2 / speed;
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div role="status" aria-label="กำลังโหลด" className="flex flex-col items-center gap-4">
        <div
          aria-hidden
          className="vt-live grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${String(size)}, 1rem)` }}
        >
          {Array.from({ length: size * size }, (_, i) => {
            const r = Math.floor(i / size);
            const c = i % size;
            return (
              <motion.span
                key={i}
                className="block size-4 rounded-sm bg-(--em-blue-500)"
                animate={{ scale: [0.55, 1, 0.55], opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: d,
                  repeat: Infinity,
                  delay: ((r + c) * d) / (2 * size),
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </div>
        <span className="text-xs text-(--em-ink-400)">กำลังโหลด</span>
      </div>
    </div>
  );
}
