"use client";

import { motion, useMotionValue, useSpring } from "motion/react";

const COLS = 10;
const ROWS = 3;
const RADIUS = 360;
const tones = [
  "bg-(--em-blue-700)",
  "bg-(--em-ink-800)",
  "bg-(--em-blue-500)",
  "bg-(--em-ink-700)",
  "bg-(--em-sky-400)",
];

/** Photo tiles lining the inside of a dome around you; drag to turn the dome, it keeps rolling a little. */
export default function DomeWall() {
  const spin = useMotionValue(0);
  const tilt = useMotionValue(0);
  const rotateY = useSpring(spin, { stiffness: 80, damping: 20 });
  const rotateX = useSpring(tilt, { stiffness: 80, damping: 20 });
  return (
    <div
      className="relative size-full min-h-80 cursor-grab touch-none overflow-hidden bg-(--em-ink-975) active:cursor-grabbing"
      style={{ perspective: 500 }}
      role="img"
      aria-label="แกลเลอรีโดม ลากเพื่อหมุน"
      onPointerMove={(e) => {
        if (e.buttons !== 1) return;
        spin.set(spin.get() + e.movementX * 0.3);
        tilt.set(Math.max(-15, Math.min(15, tilt.get() - e.movementY * 0.2)));
      }}
    >
      <motion.div
        className="absolute top-1/2 left-1/2"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        {Array.from({ length: COLS * ROWS }, (_, k) => {
          const c = k % COLS;
          const r = Math.floor(k / COLS) - 1;
          return (
            <div
              key={k}
              aria-hidden
              className={`absolute -top-14 -left-12 h-28 w-24 rounded-lg border border-(--em-ink-0)/10 ${tones[k % tones.length] ?? ""}`}
              style={{
                transform: `rotateY(${String(c * (360 / COLS))}deg) rotateX(${String(r * -18)}deg) translateZ(-${String(RADIUS)}px)`,
              }}
            />
          );
        })}
      </motion.div>
    </div>
  );
}
