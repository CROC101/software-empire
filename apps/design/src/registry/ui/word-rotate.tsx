"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/** A single slot whose word slides up and out while the next one rises in. */
export default function WordRotate({
  words = "เร็ว,สวย,ปลอดภัย",
  interval = 2,
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
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6 text-(--em-ink-100)">
      <p className="flex items-baseline gap-3 font-heading text-3xl font-black sm:text-5xl">
        <span>เว็บที่</span>
        <span className="relative inline-grid overflow-hidden py-1">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={word + String(i)}
              className="text-(--em-sky-400)"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              {word}
            </motion.span>
          </AnimatePresence>
        </span>
      </p>
    </div>
  );
}
