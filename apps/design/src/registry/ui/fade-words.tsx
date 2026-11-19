"use client";

import { motion } from "motion/react";

const words = (s: string) =>
  [...new Intl.Segmenter("th", { granularity: "word" }).segment(s)].map((w) => w.segment);

/** Words come into focus one after another, at reading pace. Thai is split by real word breaks. */
export default function FadeWords({
  text = "ทุกชิ้นขยับเบาๆ ไม่แย่งเนื้อหา",
  stagger = 0.15,
}: {
  text?: string;
  stagger?: number;
}) {
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <p
        aria-label={text}
        className="max-w-xl text-center font-heading text-3xl leading-snug font-black text-(--em-ink-50) sm:text-4xl"
      >
        {words(text).map((w, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="inline-block whitespace-pre"
            initial={{ opacity: 0.08, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ delay: i * stagger, duration: 0.5 }}
          >
            {w}
          </motion.span>
        ))}
      </p>
    </div>
  );
}
