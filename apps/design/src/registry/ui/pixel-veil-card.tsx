"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

const COLS = 12;
const ROWS = 15;
// a fixed scatter of delays so server and client render the same grid
const delays = Array.from({ length: COLS * ROWS }, (_, k) => ((k * 37) % 23) / 23);

/** A card covered by a grid of pixels that flicker on one by one when the pointer arrives, and off again when it leaves. */
export default function PixelVeilCard({ spread = 0.5 }: { spread?: number }) {
  const still = useReducedMotion();
  const [on, setOn] = useState(false);
  return (
    <div className="grid size-full min-h-80 place-items-center bg-(--em-ink-975) p-6">
      <div
        tabIndex={0}
        onPointerEnter={() => {
          setOn(true);
        }}
        onPointerLeave={() => {
          setOn(false);
        }}
        onFocus={() => {
          setOn(true);
        }}
        onBlur={() => {
          setOn(false);
        }}
        className="relative grid h-72 w-56 place-items-center overflow-hidden rounded-xl border border-(--em-ink-700) bg-(--em-ink-900) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
      >
        <div
          aria-hidden
          className="absolute inset-0 grid"
          style={{ gridTemplateColumns: `repeat(${String(COLS)}, 1fr)` }}
        >
          {delays.map((d, k) => (
            <motion.span
              key={k}
              className={k % 5 === 0 ? "bg-(--em-sky-400)" : "bg-(--em-blue-600)"}
              initial={false}
              animate={{ opacity: on ? (k % 3 === 0 ? 0.9 : 0.5) : 0 }}
              transition={{ duration: still ? 0 : 0.15, delay: still ? 0 : d * spread }}
            />
          ))}
        </div>
        <p className="relative text-2xl font-black text-(--em-ink-0)">ชี้ที่นี่</p>
      </div>
    </div>
  );
}
