"use client";

import { motion, useReducedMotion } from "motion/react";

const tones = [
  "bg-(--em-blue-700)",
  "bg-(--em-ink-800)",
  "bg-(--em-blue-500)",
  "bg-(--em-ink-700)",
  "bg-(--em-sky-500)",
  "bg-(--em-blue-800)",
];

/** A tilted wall of tiles in columns that drift up and down at different speeds, forever. */
export default function DriftWall({ speed = 1 }: { speed?: number }) {
  const still = useReducedMotion();
  return (
    <div className="relative size-full min-h-80 overflow-hidden bg-(--em-ink-975)" aria-hidden>
      <div
        className="absolute inset-[-30%] flex justify-center gap-3"
        style={{ transform: "rotateX(30deg) rotateZ(-20deg)", perspective: 900 }}
      >
        {Array.from({ length: 6 }, (_, c) => {
          const dir = c % 2 === 0 ? -1 : 1;
          const tiles = Array.from(
            { length: 12 },
            (_, k) => tones[(k + c * 2) % tones.length] ?? "",
          );
          return (
            <motion.div
              key={c}
              className={`flex w-28 shrink-0 flex-col gap-3 ${still ? "" : "vt-live"}`}
              animate={still ? {} : { y: dir < 0 ? ["0%", "-50%"] : ["-50%", "0%"] }}
              transition={{ duration: (24 + c * 4) / speed, ease: "linear", repeat: Infinity }}
            >
              {[...tiles, ...tiles].map((t, k) => (
                <span key={k} className={`h-36 shrink-0 rounded-lg ${t}`} />
              ))}
            </motion.div>
          );
        })}
      </div>
      <span className="absolute inset-0 bg-linear-to-b from-(--em-ink-975) via-transparent to-(--em-ink-975)" />
    </div>
  );
}
