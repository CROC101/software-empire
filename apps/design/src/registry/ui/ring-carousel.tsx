"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const labels = [
  "เว็บไซต์",
  "แอปมือถือ",
  "โลโก้",
  "วิดีโอ",
  "ภาพถ่าย",
  "คอร์สสอน",
  "ที่ปรึกษา",
  "หลังบ้าน",
];

/** Cards stood round a ring in 3D; the ring turns to bring the next one to the front. */
export default function RingCarousel({ items = 6 }: { items?: number }) {
  const n = Math.max(3, Math.min(labels.length, items));
  const [turn, setTurn] = useState(0);
  const step = 360 / n;
  const radius = Math.round(80 / Math.tan(Math.PI / n)) + 24;
  const active = ((turn % n) + n) % n;
  return (
    <div className="grid size-full min-h-80 place-items-center overflow-hidden bg-(--em-ink-975) p-6">
      <div
        className="flex flex-col items-center gap-6"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setTurn(turn + 1);
          else if (e.key === "ArrowLeft") setTurn(turn - 1);
        }}
      >
        <div className="relative h-44 w-40" style={{ perspective: 1000 }}>
          <motion.div
            className="absolute inset-0"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: -turn * step }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          >
            {Array.from({ length: n }, (_, k) => (
              <div
                key={k}
                aria-hidden={k !== active}
                className={`absolute inset-0 grid place-items-center rounded-lg border text-lg font-black ${k === active ? "border-(--em-blue-500) bg-(--em-blue-700) text-(--em-ink-0)" : "border-(--em-ink-700) bg-(--em-ink-850) text-(--em-ink-300)"}`}
                style={{
                  transform: `rotateY(${String(k * step)}deg) translateZ(${String(radius)}px)`,
                  backfaceVisibility: "hidden",
                }}
              >
                {labels[k]}
              </div>
            ))}
          </motion.div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="ก่อนหน้า"
            onClick={() => {
              setTurn(turn - 1);
            }}
            className="grid size-9 place-items-center rounded-md bg-(--em-ink-800) text-(--em-ink-100) hover:bg-(--em-ink-700) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span
            className="w-12 text-center font-mono text-xs text-(--em-ink-400) tabular-nums"
            aria-live="polite"
          >
            {active + 1}/{n}
          </span>
          <button
            type="button"
            aria-label="ถัดไป"
            onClick={() => {
              setTurn(turn + 1);
            }}
            className="grid size-9 place-items-center rounded-md bg-(--em-ink-800) text-(--em-ink-100) hover:bg-(--em-ink-700) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
