"use client";

import { motion } from "motion/react";

const tones = {
  blue: "var(--em-blue-600)",
  sky: "var(--em-sky-500)",
  gold: "var(--em-gold-500)",
} as const;

/** A highlighter pen sweeps across the key words when they scroll into view (scaleX from the left). */
export default function MarkerHighlight({
  before = "งานที่",
  mark = "ส่งตรงเวลา",
  tone = "sky",
}: {
  before?: string;
  mark?: string;
  tone?: keyof typeof tones;
}) {
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <p className="text-center font-heading text-3xl font-black text-(--em-ink-50) sm:text-5xl">
        {before}{" "}
        <span className="relative inline-block px-1">
          <motion.span
            aria-hidden
            className="absolute inset-x-0 bottom-[0.08em] h-[0.45em] origin-left -skew-x-6 rounded-sm opacity-80"
            style={{ background: tones[tone] }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.65, 0, 0.35, 1] }}
          />
          <span className="relative">{mark}</span>
        </span>
      </p>
    </div>
  );
}
