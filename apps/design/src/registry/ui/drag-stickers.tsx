"use client";

import { motion } from "motion/react";
import { useRef } from "react";

const stickers = [
  { t: "ส่งงานไว", c: "bg-(--em-gold-500) text-(--em-ink-950)", x: "12%", y: "18%", r: -8 },
  { t: "ใช้ได้จริง", c: "bg-(--em-sky-400) text-(--em-ink-950)", x: "56%", y: "14%", r: 6 },
  { t: "crocwork", c: "bg-(--em-blue-600) text-(--em-ink-0)", x: "30%", y: "56%", r: -3 },
  { t: "โอเค", c: "bg-(--em-coral-500) text-(--em-ink-0)", x: "64%", y: "62%", r: 10 },
];

/** Stickers you can pick up and throw around the stage; they lift while held and settle with a small bounce. */
export default function DragStickers() {
  const stage = useRef<HTMLDivElement>(null);
  return (
    <div ref={stage} className="relative size-full min-h-80 overflow-hidden bg-(--em-ink-975) p-6">
      <p className="text-center text-sm text-(--em-ink-400)">ลากสติกเกอร์ไปวางที่ไหนก็ได้</p>
      {stickers.map((s) => (
        <motion.span
          key={s.t}
          drag
          dragConstraints={stage}
          dragElastic={0.2}
          dragTransition={{ bounceStiffness: 500, bounceDamping: 18 }}
          initial={{ rotate: s.r }}
          whileDrag={{ scale: 1.12, rotate: 0, cursor: "grabbing" }}
          whileHover={{ scale: 1.04 }}
          className={`absolute cursor-grab touch-none rounded-md px-4 py-2 font-heading font-black shadow-xl select-none ${s.c}`}
          style={{ left: s.x, top: s.y }}
        >
          {s.t}
        </motion.span>
      ))}
    </div>
  );
}
