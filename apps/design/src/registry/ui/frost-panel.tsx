"use client";

import { motion, useReducedMotion } from "motion/react";

/** A frosted glass panel over slow drifting shapes; the blur and the bright rim make the surface read as glass. */
export default function FrostPanel({ blur = 16 }: { blur?: number }) {
  const still = useReducedMotion();
  const drift = (dx: number, dy: number, s: number) =>
    still
      ? {}
      : {
          animate: { x: [0, dx, 0], y: [0, dy, 0] },
          transition: { duration: s, repeat: Infinity, ease: "easeInOut" as const },
        };
  return (
    <div className="relative grid size-full min-h-72 place-items-center overflow-hidden bg-(--em-ink-975) p-6">
      <motion.span
        aria-hidden
        {...drift(80, 30, 9)}
        className="vt-live absolute top-8 left-1/4 size-32 rounded-full bg-(--em-blue-500)"
      />
      <motion.span
        aria-hidden
        {...drift(-60, 40, 11)}
        className="vt-live absolute right-1/4 bottom-6 size-40 rounded-full bg-(--em-sky-400)"
      />
      <motion.span
        aria-hidden
        {...drift(40, -50, 13)}
        className="vt-live absolute top-1/2 left-1/2 size-20 rounded-md bg-(--em-ink-200)"
      />
      <div
        className="relative w-full max-w-xs rounded-xl border border-(--em-ink-0)/20 bg-(--em-ink-900)/40 p-6"
        style={{
          backdropFilter: `blur(${String(blur)}px)`,
          WebkitBackdropFilter: `blur(${String(blur)}px)`,
        }}
      >
        <span aria-hidden className="absolute inset-x-4 top-0 h-px bg-(--em-ink-0)/40" />
        <p className="font-mono text-xs text-(--em-ink-300)">ยอดเดือนนี้</p>
        <p className="mt-2 text-3xl font-black text-(--em-ink-0) tabular-nums">฿48,200</p>
        <p className="mt-1 text-sm text-(--em-ink-200)">+12% จากเดือนที่แล้ว</p>
      </div>
    </div>
  );
}
