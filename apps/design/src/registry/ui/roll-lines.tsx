"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/** Three lines in a window; every few seconds the stack rolls up one line and the middle one lights. */
export default function RollLines({
  lines = "ออกแบบ,เขียนโค้ด,ทดสอบ,ส่งงาน",
  interval = 1.8,
}: {
  lines?: string;
  interval?: number;
}) {
  const list = lines
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const still = useReducedMotionAfterMount();
  const [at, setAt] = useState(0);

  useEffect(() => {
    if (still || list.length < 2) return;
    const id = setInterval(() => {
      setAt((a) => a + 1);
    }, interval * 1000);
    return () => {
      clearInterval(id);
    };
  }, [interval, still, list.length]);

  const n = Math.max(list.length, 1);
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <ul
        aria-live="polite"
        className="grid h-[3.6em] content-center overflow-hidden font-heading text-3xl font-black sm:text-5xl"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {[0, 1, 2].map((k) => (
            <motion.li
              key={at + k}
              layout
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: k === 1 ? 1 : 0.25, y: 0 }}
              exit={{ opacity: 0, y: "-100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className={`h-[1.2em] leading-[1.2em] ${k === 1 ? "text-(--em-ink-50)" : "text-(--em-ink-500)"}`}
            >
              {list[(at + k) % n]}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
