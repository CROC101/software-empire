"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { useReducedMotionAfterMount } from "../lib/use-reduced-motion";

/**
 * A pinned scroll interlude: a headline whose letters fly in from a fan and fold into place,
 * then a row of items that swing in after it. Native scrolling only: the section is tall and
 * its stage is `position: sticky`; progress is read from the scroll position, never driven.
 * Transforms only, so it stays on the compositor. Reduced motion renders it assembled.
 */

const ASSEMBLED = 0.55; // share of the pinned scroll spent assembling; the rest holds the shot

/** Grapheme clusters, so Thai vowels and tone marks stay on their consonant. */
function graphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(
      new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text),
      (s) => s.segment,
    );
  }
  return Array.from(text);
}

function Letter({
  char,
  offset,
  progress,
}: {
  char: string;
  offset: number;
  progress: MotionValue<number>;
}) {
  const x = useTransform(progress, [0, ASSEMBLED], [offset * 50, 0]);
  const rotateX = useTransform(progress, [0, ASSEMBLED], [offset * 50, 0]);
  return (
    <motion.span
      aria-hidden
      className={cn("inline-block", char === " " && "w-[0.3em]")}
      style={{ x, rotateX }}
    >
      {char}
    </motion.span>
  );
}

function Item({
  children,
  offset,
  progress,
}: {
  children: ReactNode;
  offset: number;
  progress: MotionValue<number>;
}) {
  const range = [0.15, ASSEMBLED + 0.1];
  const x = useTransform(progress, range, [offset * 90, 0]);
  const rotate = useTransform(progress, range, [offset * 50, 0]);
  const y = useTransform(progress, range, [-Math.abs(offset) * 20, 0]);
  const scale = useTransform(progress, range, [0.75, 1]);
  return <motion.div style={{ x, rotate, y, scale }}>{children}</motion.div>;
}

export function ScrollAssemble({
  title,
  eyebrow,
  caption,
  items = [],
  backdrop,
  titleClassName,
  className,
}: {
  title: string;
  eyebrow?: ReactNode;
  caption?: ReactNode;
  items?: readonly ReactNode[];
  /** Scenery behind the stage (absolute, decorative), e.g. a horizon. */
  backdrop?: ReactNode;
  titleClassName?: string;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotionAfterMount();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const chars = graphemes(title);
  const mid = Math.floor(chars.length / 2);
  // group by word, keeping each letter's index in the whole title (the fan is centred on it)
  const words = chars.reduce<{ char: string; at: number }[][]>((acc, char, at) => {
    if (char === " " || acc.length === 0) acc.push([]);
    acc[acc.length - 1]?.push({ char, at });
    return acc;
  }, []);
  const itemMid = Math.floor(items.length / 2);

  return (
    <section ref={ref} className={cn("relative", reduced ? "py-24" : "h-[220vh]", className)}>
      <div
        className={cn(
          "relative isolate flex flex-col items-center justify-center gap-10 overflow-hidden px-4 text-center",
          !reduced && "sticky top-0 h-svh",
        )}
      >
        {backdrop && (
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            {backdrop}
          </div>
        )}
        {eyebrow}
        <h2
          aria-label={title}
          className={cn(
            "text-5xl font-black uppercase leading-none tracking-tighter sm:text-8xl",
            titleClassName,
          )}
          style={{ perspective: "500px" }}
        >
          {reduced
            ? title
            : words.map((word, w) => (
                // letters of one word never wrap apart
                <span key={w} className="inline-block whitespace-nowrap">
                  {word.map(({ char, at }) => (
                    <Letter key={at} char={char} offset={at - mid} progress={scrollYProgress} />
                  ))}
                </span>
              ))}
        </h2>
        {items.length > 0 && (
          <div
            className="flex flex-wrap items-start justify-center gap-6 sm:gap-8"
            style={{ perspective: "500px" }}
          >
            {reduced
              ? items
              : items.map((node, i) => (
                  <Item key={i} offset={i - itemMid} progress={scrollYProgress}>
                    {node}
                  </Item>
                ))}
          </div>
        )}
        {caption}
      </div>
    </section>
  );
}
