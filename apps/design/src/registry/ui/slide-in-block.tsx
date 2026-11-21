"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

const axis = {
  ขึ้น: { y: 1 },
  ลง: { y: -1 },
  ซ้าย: { x: 1 },
  ขวา: { x: -1 },
} as const;

/**
 * A block slides in from the side you pick when it scrolls into view and settles on a spring.
 * "อีกครั้ง" plays it again; reduced motion shows it in place.
 */
export default function SlideInBlock({
  direction = "ขึ้น",
  distance = 80,
  bounce = 0.25,
}: {
  direction?: keyof typeof axis;
  distance?: number;
  bounce?: number;
}) {
  const [run, setRun] = useState(0);
  const still = useReducedMotion();
  const d = axis[direction];
  const from = {
    opacity: 0,
    x: ("x" in d ? d.x : 0) * distance,
    y: ("y" in d ? d.y : 0) * distance,
  };
  return (
    <div className="grid size-full min-h-72 place-items-center gap-4 overflow-hidden bg-(--em-ink-975) p-6">
      <motion.article
        key={run}
        initial={still ? false : from}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ type: "spring", bounce, duration: 0.9 }}
        className="w-full max-w-sm rounded-xl border border-(--em-ink-800) bg-(--em-ink-900) p-6"
      >
        <p className="font-mono text-xs tracking-[0.2em] text-(--em-sky-400) uppercase">case 04</p>
        <h3 className="mt-2 font-heading text-2xl font-black text-(--em-ink-50)">ร้านกาแฟริมน้ำ</h3>
        <p className="mt-2 text-sm text-(--em-ink-400)">
          หน้าร้านออนไลน์ สั่งล่วงหน้า รับที่เคาน์เตอร์ ส่งงานภายในสามสัปดาห์
        </p>
      </motion.article>
      <button
        type="button"
        onClick={() => {
          setRun((r) => r + 1);
        }}
        className="rounded-md border border-(--em-ink-700) px-3 py-1.5 text-sm text-(--em-ink-300) transition-colors hover:text-(--em-ink-50)"
      >
        อีกครั้ง
      </button>
    </div>
  );
}
