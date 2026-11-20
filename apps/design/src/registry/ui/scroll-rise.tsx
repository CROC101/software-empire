"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

const graphemes = (s: string) =>
  [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(s)].map((g) => g.segment);

function Letter({ c, i, n, p }: { c: string; i: number; n: number; p: MotionValue<number> }) {
  const start = (i / Math.max(n, 1)) * 0.5;
  const y = useTransform(p, [start, start + 0.5], ["1.4em", "0em"]);
  const opacity = useTransform(p, [start, start + 0.4], [0, 1]);
  return (
    <motion.span aria-hidden className="inline-block whitespace-pre" style={{ y, opacity }}>
      {c}
    </motion.span>
  );
}

/**
 * Scroll and the letters float up into place one after another, tied to how far you have scrolled.
 * The panel scrolls on its own, so it works inside any page.
 */
export default function ScrollRise({ text = "ลอยขึ้นมา" }: { text?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll({
    container: box,
    target,
    offset: ["start end", "center center"],
  });
  const chars = graphemes(text);
  return (
    <div
      ref={box}
      tabIndex={0}
      aria-label="เลื่อนลงในกรอบนี้"
      className="relative size-full max-h-[28rem] min-h-56 overflow-y-auto bg-(--em-ink-975) text-center"
    >
      <p className="grid h-56 place-items-center text-sm text-(--em-ink-500)">เลื่อนลง</p>
      <h2
        ref={target}
        aria-label={text}
        className="overflow-hidden py-24 font-heading text-5xl font-black text-(--em-ink-50) sm:text-7xl"
      >
        {chars.map((c, i) => (
          <Letter key={i} c={c} i={i} n={chars.length} p={scrollYProgress} />
        ))}
      </h2>
      <div className="h-40" />
    </div>
  );
}
