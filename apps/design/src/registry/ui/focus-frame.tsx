"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { motion } from "motion/react";
import { useEffect, useId, useState } from "react";

/**
 * A viewfinder hops from word to word: the word inside the corner marks is sharp, the rest go soft.
 * Hover a word to pick it yourself.
 */
export default function FocusFrame({
  text = "ดู ทีละ คำ ให้ ชัด",
  interval = 1.4,
  blur = 4,
}: {
  text?: string;
  interval?: number;
  blur?: number;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  const still = useReducedMotionAfterMount();
  const [at, setAt] = useState(0);
  const frame = `focus-frame${useId()}`; // unique, or two copies on one page swap frames
  const [held, setHeld] = useState<number | null>(null);

  useEffect(() => {
    if (still || held !== null) return;
    const id = setInterval(() => {
      setAt((a) => a + 1);
    }, interval * 1000);
    return () => {
      clearInterval(id);
    };
  }, [interval, still, held]);

  const active = held ?? at % Math.max(words.length, 1);
  const corner = "absolute size-3 border-(--em-blue-400)";
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <p className="flex flex-wrap justify-center gap-x-5 gap-y-3 font-heading text-4xl font-black text-(--em-ink-50) sm:text-6xl">
        {words.map((w, i) => (
          <span
            key={i}
            className="relative px-2 transition-[filter,opacity] duration-500"
            style={i === active ? undefined : { filter: `blur(${String(blur)}px)`, opacity: 0.45 }}
            onPointerEnter={() => {
              setHeld(i);
            }}
            onPointerLeave={() => {
              setHeld(null);
            }}
          >
            {w}
            {i === active && (
              <motion.span
                layoutId={frame}
                aria-hidden
                className="pointer-events-none absolute -inset-1"
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
              >
                <span className={`${corner} top-0 left-0 border-t-2 border-l-2`} />
                <span className={`${corner} top-0 right-0 border-t-2 border-r-2`} />
                <span className={`${corner} bottom-0 left-0 border-b-2 border-l-2`} />
                <span className={`${corner} right-0 bottom-0 border-r-2 border-b-2`} />
              </motion.span>
            )}
          </span>
        ))}
      </p>
    </div>
  );
}
