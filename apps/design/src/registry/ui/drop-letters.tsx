"use client";

import { motion } from "motion/react";
import { useState } from "react";

const graphemes = (s: string) =>
  [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(s)].map((g) => g.segment);

// fixed per index so server and client agree
const jitter = (i: number) => (((Math.sin(i * 12.9898) * 43758.5453) % 1) + 1) % 1;

/** Tap and the letters lose their footing: each one drops, tumbles and bounces on the floor. Tap again to stand them up. */
export default function DropLetters({
  text = "แรงโน้มถ่วง",
  bounce = 0.5,
}: {
  text?: string;
  bounce?: number;
}) {
  const [down, setDown] = useState(false);
  return (
    <div className="relative grid size-full min-h-56 grid-rows-[1fr_auto] place-items-center overflow-hidden bg-(--em-ink-975) p-6">
      <button
        type="button"
        aria-pressed={down}
        aria-label={`${text}: ${down ? "ตั้งกลับ" : "ปล่อยตัวอักษร"}`}
        onClick={() => {
          setDown((d) => !d);
        }}
        className="self-start pt-4 font-heading text-5xl font-black text-(--em-ink-50) sm:text-7xl"
      >
        {graphemes(text).map((c, i) => {
          const r = jitter(i);
          return (
            <motion.span
              key={i}
              aria-hidden
              className="inline-block whitespace-pre"
              animate={
                down
                  ? { y: `${String(1.6 + r * 0.5)}em`, rotate: (r - 0.5) * 70 }
                  : { y: 0, rotate: 0 }
              }
              transition={{ type: "spring", bounce, duration: 0.9, delay: down ? r * 0.25 : 0 }}
            >
              {c}
            </motion.span>
          );
        })}
      </button>
      <p
        aria-hidden
        className="w-full border-t border-(--em-ink-800) pt-2 text-center text-xs text-(--em-ink-500)"
      >
        แตะที่คำ
      </p>
    </div>
  );
}
