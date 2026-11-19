"use client";

import { motion } from "motion/react";
import { useState } from "react";

const graphemes = (s: string) =>
  [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(s)].map((g) => g.segment);

/** Letters rise out of the water one by one. Split by grapheme so Thai vowels and tone marks never fall off. */
export default function SplitChars({
  text = "ขึ้นจากน้ำ",
  stagger = 0.06,
}: {
  text?: string;
  stagger?: number;
}) {
  const [run, setRun] = useState(0);
  return (
    <div className="grid size-full min-h-56 place-items-center gap-4 bg-(--em-ink-975) p-6 text-(--em-ink-50)">
      <p key={run} aria-label={text} className="font-heading text-4xl font-black sm:text-6xl">
        {graphemes(text).map((g, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="inline-block whitespace-pre"
            initial={{ y: "0.8em", opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: i * stagger, type: "spring", stiffness: 300, damping: 18 }}
          >
            {g}
          </motion.span>
        ))}
      </p>
      <button
        type="button"
        onClick={() => {
          setRun((r) => r + 1);
        }}
        className="rounded-md border border-(--em-ink-700) px-3 py-1.5 text-sm text-(--em-ink-300) transition-colors hover:text-(--em-ink-50)"
      >
        เล่นอีกครั้ง
      </button>
    </div>
  );
}
