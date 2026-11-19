"use client";

import { motion } from "motion/react";

const modes = {
  blur: {
    hidden: { opacity: 0, filter: "blur(10px)", y: 8 },
    shown: { opacity: 1, filter: "blur(0px)", y: 0 },
  },
  rise: { hidden: { opacity: 0, y: "0.9em" }, shown: { opacity: 1, y: 0 } },
  flip: { hidden: { opacity: 0, rotateX: -80 }, shown: { opacity: 1, rotateX: 0 } },
} as const;

/** Words or grapheme clusters, so Thai vowels and tone marks never split from their letter. */
function pieces(text: string, split: "words" | "chars"): string[] {
  const granularity = split === "words" ? "word" : "grapheme";
  return Array.from(new Intl.Segmenter("th", { granularity }).segment(text), (s) => s.segment);
}

/** Text that comes in piece by piece when it scrolls into view. */
export function RevealText({
  text = "ออกแบบให้ขยับอย่างมีเหตุผล",
  split = "words",
  mode = "blur",
  stagger = 70,
}: {
  text?: string;
  split?: "words" | "chars";
  mode?: keyof typeof modes;
  stagger?: number;
}) {
  const variant = modes[mode];
  return (
    <div className="flex size-full min-h-40 items-center justify-center bg-(--em-ink-975) p-6 [perspective:600px]">
      <motion.p
        // remount on change, so the playground replays the reveal
        key={`${text}|${split}|${mode}|${stagger}`}
        aria-label={text}
        className="m-0 max-w-xl text-center font-heading text-3xl leading-snug font-black text-(--em-ink-50) sm:text-4xl"
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, amount: 0.4 }}
        transition={{ staggerChildren: stagger / 1000 }}
      >
        {pieces(text, split).map((p, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="inline-block whitespace-pre"
            variants={variant}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
          >
            {p}
          </motion.span>
        ))}
      </motion.p>
    </div>
  );
}
