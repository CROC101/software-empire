"use client";

import { RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

/** A circle swells, the tick draws itself and a ring of sparks flies out. Replay with the button. */
export default function SuccessBurst() {
  const [run, setRun] = useState(0);
  return (
    <div className="flex size-full min-h-72 flex-col items-center justify-center gap-5 bg-(--em-ink-975) p-6">
      <div
        key={run}
        role="status"
        aria-label="สำเร็จ"
        className="relative grid size-24 place-items-center"
      >
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <motion.span
              key={i}
              aria-hidden
              className="absolute size-2 rounded-full bg-(--em-teal-400)"
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{ x: Math.cos(a) * 60, y: Math.sin(a) * 60, opacity: [0, 1, 0] }}
              transition={{ delay: 0.35, duration: 0.6 }}
            />
          );
        })}
        <motion.span
          className="absolute inset-0 rounded-full bg-(--em-teal-600)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
        />
        <svg viewBox="0 0 24 24" aria-hidden className="relative size-12">
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke="var(--em-ink-0)"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.25, duration: 0.35 }}
          />
        </svg>
      </div>
      <p className="font-heading text-lg font-black text-(--em-ink-50)">ชำระเงินสำเร็จ</p>
      <button
        type="button"
        onClick={() => {
          setRun((r) => r + 1);
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-(--em-ink-700) px-3 py-1.5 text-sm text-(--em-ink-200) hover:bg-(--em-ink-800)"
      >
        <RotateCcw aria-hidden className="size-4" />
        เล่นอีกครั้ง
      </button>
    </div>
  );
}
