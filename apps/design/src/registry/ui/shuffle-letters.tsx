"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const graphemes = (s: string) =>
  [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(s)].map((g) => g.segment);

/** The letters swap places like cards being shuffled, then slide back into the word. */
export default function ShuffleLetters({
  text = "CROCWORK",
  interval = 1.6,
}: {
  text?: string;
  interval?: number;
}) {
  const chars = graphemes(text);
  const still = useReducedMotionAfterMount();
  const [order, setOrder] = useState<number[] | null>(null);

  useEffect(() => {
    if (still) return;
    const id = setInterval(() => {
      setOrder((o) => {
        if (o) return null;
        const next = chars.map((_, i) => i);
        for (let i = next.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [next[i], next[j]] = [next[j] ?? 0, next[i] ?? 0];
        }
        return next;
      });
    }, interval * 1000);
    return () => {
      clearInterval(id);
    };
  }, [interval, still, chars.length]); // eslint-disable-line react-hooks/exhaustive-deps -- only the count matters

  const shown = order ?? chars.map((_, i) => i);
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <p
        aria-label={text}
        className="flex font-heading text-5xl font-black text-(--em-ink-50) sm:text-7xl"
      >
        {shown.map((i) => (
          <motion.span
            key={i}
            layout
            aria-hidden
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className={`inline-block whitespace-pre ${order ? "text-(--em-blue-400)" : ""}`}
          >
            {chars[i]}
          </motion.span>
        ))}
      </p>
    </div>
  );
}
