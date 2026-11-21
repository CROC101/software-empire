"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

const panels = [
  { title: "ร้านกาแฟริมน้ำ", note: "เว็บสั่งล่วงหน้า" },
  { title: "คลินิกฟันยิ้ม", note: "ระบบนัดคิว" },
  { title: "โฮมสเตย์ปาย", note: "หน้าจองห้อง" },
  { title: "ร้านดอกไม้", note: "แคตตาล็อกออนไลน์" },
];

/** A strip of panels where the open one grows wide, and a bar inside it counts down to the next. */
export default function GrowStrip({ seconds = 4 }: { seconds?: number }) {
  const still = useReducedMotion();
  const [open, setOpen] = useState(0);
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <div className="flex h-56 w-full max-w-xl gap-2">
        {panels.map((p, i) => (
          <motion.button
            key={p.title}
            type="button"
            layout
            aria-expanded={open === i}
            onClick={() => {
              setOpen(i);
            }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            className={`relative flex min-w-12 flex-col justify-end overflow-hidden rounded-lg border p-4 text-left focus-visible:outline-2 focus-visible:outline-(--em-sky-400) ${open === i ? "flex-[4] border-(--em-blue-500) bg-(--em-blue-800)" : "flex-1 border-(--em-ink-800) bg-(--em-ink-900) hover:bg-(--em-ink-850)"}`}
          >
            <motion.span layout="position" className="block">
              <span
                className={`block font-black whitespace-nowrap ${open === i ? "text-lg text-(--em-ink-0)" : "text-sm text-(--em-ink-300) [writing-mode:vertical-rl]"}`}
              >
                {p.title}
              </span>
              {open === i && <span className="block text-xs text-(--em-ink-200)">{p.note}</span>}
            </motion.span>
            {open === i && !still && (
              <motion.span
                key={open}
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 origin-left bg-(--em-sky-400)"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: seconds, ease: "linear" }}
                onAnimationComplete={() => {
                  setOpen((open + 1) % panels.length);
                }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
