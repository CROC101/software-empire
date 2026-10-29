"use client";

import { AnimatePresence, LazyMotion, domAnimation, m, type Transition } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import { useReducedMotionAfterMount } from "../lib/use-reduced-motion";

/**
 * Text loop: a fixed word, then a word that swaps every few seconds. The new word wipes in by
 * width over a soft highlight, with a blinking cursor after it. Reduced motion swaps without the
 * wipe and keeps the cursor still.
 *
 * After "Text Loop" (21st.dev): crocwork blue tokens instead of violet, padding so Thai marks
 * above and below the line are not clipped by the wipe, `vt-live` on the blinking cursor.
 */
export function TextLoop({
  staticText,
  rotatingTexts,
  interval = 2600,
  transition = { duration: 0.7, ease: "easeInOut" },
  className,
  staticTextClassName,
  rotatingTextClassName,
}: {
  staticText: string;
  rotatingTexts: readonly string[];
  /** ms between words */
  interval?: number;
  transition?: Transition;
  className?: string;
  staticTextClassName?: string;
  rotatingTextClassName?: string;
}) {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotionAfterMount();

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, interval);
    return () => {
      clearInterval(timer);
    };
  }, [rotatingTexts.length, interval]);

  const word = rotatingTexts[index] ?? "";

  return (
    <LazyMotion features={domAnimation}>
      <p className={cn("flex w-fit flex-row flex-wrap items-center", className)}>
        <span className={cn("mr-3 whitespace-nowrap", staticTextClassName)}>{staticText}</span>
        <span className="relative flex items-center">
          <AnimatePresence mode="wait">
            <m.span
              key={word}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={reduced ? { duration: 0 } : transition}
              // the vertical padding keeps Thai marks inside the clip
              className="relative -my-[0.2em] block overflow-hidden py-[0.2em] whitespace-nowrap"
              aria-live="polite"
            >
              <span
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, color-mix(in oklab, var(--em-blue-500) 10%, transparent) 40%, color-mix(in oklab, var(--em-blue-500) 22%, transparent))",
                }}
              />
              <span
                className={cn("relative bg-clip-text pr-1 text-transparent", rotatingTextClassName)}
                style={{
                  backgroundImage: "linear-gradient(90deg, var(--em-blue-500), var(--em-blue-700))",
                }}
              >
                {word}
              </span>
            </m.span>
          </AnimatePresence>
          <m.span
            aria-hidden
            className="vt-live block h-[1em] w-[3px] md:w-[4px]"
            style={{ background: "var(--em-blue-500)" }}
            animate={reduced ? { opacity: 1 } : { opacity: [1, 0.35] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
          />
        </span>
      </p>
    </LazyMotion>
  );
}
