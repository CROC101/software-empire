"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/** Words flip on the X axis like a split-flap board at an airport. */
export default function FlipWords({
  words = "Design,Build,Ship",
  interval = 2.5,
}: {
  words?: string;
  interval?: number;
}) {
  const list = words
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);
  const still = useReducedMotionAfterMount();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (still || list.length < 2) return;
    const t = setInterval(() => {
      setI((n) => n + 1);
    }, interval * 1000);
    return () => {
      clearInterval(t);
    };
  }, [interval, list.length, still]);

  const word = list[i % Math.max(1, list.length)] ?? "";
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6 [perspective:600px]">
      <div className="relative grid min-w-56 place-items-center rounded-lg border border-(--em-ink-800) bg-(--em-ink-900) px-8 py-5 shadow-2xl">
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-(--em-ink-975)" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={word + String(i)}
            className="font-mono text-4xl font-bold text-(--em-ink-50) sm:text-5xl"
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 90, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {word}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
