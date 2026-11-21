"use client";

import { Heart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const sparks = [0, 60, 120, 180, 240, 300];

/** A like button that pops, throws a ring and six sparks, and counts up when you like. */
export default function PulseHeart({ count = 128 }: { count?: number }) {
  const [on, setOn] = useState(false);
  const [round, setRound] = useState(0);
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <button
        type="button"
        aria-pressed={on}
        aria-label="ถูกใจ"
        onClick={() => {
          if (!on) setRound((r) => r + 1);
          setOn(!on);
        }}
        className="flex items-center gap-3 rounded-lg px-3 py-2 focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
      >
        <span className="relative grid size-10 place-items-center">
          <AnimatePresence>
            {on && (
              <motion.span key={round} className="absolute inset-0" exit={{ opacity: 0 }}>
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-(--em-sky-400)"
                  initial={{ scale: 0.3, opacity: 1 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
                {sparks.map((a) => {
                  const r = (a * Math.PI) / 180;
                  return (
                    <motion.span
                      key={a}
                      className="absolute top-1/2 left-1/2 -mt-1 -ml-1 size-2 rounded-full bg-(--em-sky-400)"
                      initial={{ x: 0, y: 0, opacity: 1 }}
                      animate={{ x: Math.cos(r) * 26, y: Math.sin(r) * 26, opacity: 0 }}
                      transition={{ duration: 0.55, ease: "easeOut" }}
                    />
                  );
                })}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.span
            key={String(on)}
            initial={{ scale: on ? 0.4 : 1 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 12 }}
            className="relative"
          >
            <Heart
              className={`size-7 ${on ? "fill-(--em-sky-400) text-(--em-sky-400)" : "text-(--em-ink-400)"}`}
              strokeWidth={1.5}
            />
          </motion.span>
        </span>
        <span className="font-mono text-sm text-(--em-ink-200) tabular-nums">
          {count + (on ? 1 : 0)}
        </span>
      </button>
    </div>
  );
}
