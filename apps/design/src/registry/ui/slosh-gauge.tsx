"use client";

import { motion } from "motion/react";

// two half-waves per 50 units, 300 units wide, so shifting by a third loops seamlessly
const wave = `M0 12 ${Array.from({ length: 12 }, (_, k) => `q12.5 ${k % 2 ? 8 : -8} 25 0`).join(" ")} V40 H0 Z`;

/** A round gauge filled with water: the level springs to the value and the surface sloshes when it moves. */
export default function SloshGauge({ value = 62 }: { value?: number }) {
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-label="ระดับน้ำ"
        className="relative size-40 overflow-hidden rounded-full border-2 border-(--em-ink-700) bg-(--em-ink-900)"
      >
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ y: `${String(100 - value)}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 12 }}
        >
          <motion.div
            key={value}
            className="absolute -top-3 -left-full h-10 w-[300%]"
            animate={{ rotate: [0, -7, 5, -2, 0] }}
            transition={{ duration: 1.6 }}
          >
            <motion.svg
              aria-hidden
              viewBox="0 0 300 40"
              preserveAspectRatio="none"
              className="vt-live size-full"
              animate={{ x: ["0%", "-33.333%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <path d={wave} fill="var(--em-blue-600)" />
            </motion.svg>
          </motion.div>
          <div className="absolute inset-x-0 top-6 bottom-0 bg-(--em-blue-600)" />
        </motion.div>
        <span className="absolute inset-0 grid place-items-center text-3xl font-black text-(--em-ink-0) tabular-nums">
          {value}%
        </span>
      </div>
    </div>
  );
}
