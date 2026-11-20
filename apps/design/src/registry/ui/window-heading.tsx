"use client";

import { motion } from "motion/react";
import { useState } from "react";

/** Each line of the heading rises out of its own slot, one after another. Lines split on "|". */
export default function WindowHeading({
  text = "ทุกบรรทัด|โผล่จาก|ช่องของมันเอง",
  stagger = 0.12,
}: {
  text?: string;
  stagger?: number;
}) {
  const [run, setRun] = useState(0);
  const lines = text.split("|");
  return (
    <div className="grid size-full min-h-56 place-items-center gap-4 bg-(--em-ink-975) p-6">
      <h2
        key={run}
        aria-label={lines.join(" ")}
        className="font-heading text-4xl leading-tight font-black text-(--em-ink-50) sm:text-6xl"
      >
        {lines.map((l, i) => (
          <span key={i} aria-hidden className="block overflow-hidden pb-[0.08em]">
            <motion.span
              className={`block ${i === lines.length - 1 ? "text-(--em-blue-400)" : ""}`}
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{ delay: i * stagger, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {l}
            </motion.span>
          </span>
        ))}
      </h2>
      <button
        type="button"
        onClick={() => {
          setRun((r) => r + 1);
        }}
        className="rounded-md border border-(--em-ink-700) px-3 py-1.5 text-sm text-(--em-ink-300) transition-colors hover:text-(--em-ink-50)"
      >
        เล่นอีกครั้ง
      </button>
    </div>
  );
}
