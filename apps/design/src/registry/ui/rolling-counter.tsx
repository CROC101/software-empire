"use client";

import { motion } from "motion/react";

const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** Each digit is a strip of 0-9 that springs up or down to the new value, like a mechanical counter. */
export default function RollingCounter({ value = 2026 }: { value?: number }) {
  const n = Math.min(99999, Math.max(0, Math.round(value)));
  const text = n.toLocaleString("en-US");
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div className="text-center">
        <p className="font-mono text-xs tracking-[0.2em] text-(--em-sky-400) uppercase">
          projects shipped
        </p>
        <p
          aria-label={text}
          className="mt-3 flex font-heading text-6xl leading-none font-black text-(--em-ink-50) tabular-nums"
        >
          {text.split("").map((ch, i) =>
            ch === "," ? (
              <span key={`c${String(i)}`} aria-hidden className="px-0.5">
                ,
              </span>
            ) : (
              <span
                key={`d${String(text.length - i)}`}
                aria-hidden
                className="relative inline-block h-[1em] overflow-hidden"
              >
                <span className="invisible">0</span>
                <motion.span
                  className="absolute inset-x-0 top-0 flex flex-col"
                  initial={false}
                  animate={{ y: `${String(-Number(ch) * 10)}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                >
                  {digits.map((d) => (
                    <span key={d} className="h-[1em]">
                      {d}
                    </span>
                  ))}
                </motion.span>
              </span>
            ),
          )}
        </p>
      </div>
    </div>
  );
}
