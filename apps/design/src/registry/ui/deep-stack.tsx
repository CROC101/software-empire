"use client";

import { motion } from "motion/react";
import { useState } from "react";

const cards = ["บ้านริมคลอง", "ตึกแถวเก่า", "สวนหลังบ้าน", "ห้องสมุดเล็ก", "ร้านขนมปัง", "ท่าเรือ"];

/** A carousel where cards sit at different depths; the chosen one comes forward, its neighbours step back. */
export default function DeepStack() {
  const [at, setAt] = useState(2);
  return (
    <div className="grid size-full min-h-72 place-items-center overflow-hidden bg-(--em-ink-975) p-6">
      <div
        role="listbox"
        tabIndex={0}
        aria-label="ผลงาน"
        aria-activedescendant={`deep-${String(at)}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setAt(Math.min(cards.length - 1, at + 1));
          else if (e.key === "ArrowLeft") setAt(Math.max(0, at - 1));
        }}
        className="relative h-48 w-full max-w-md rounded-lg focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
      >
        {cards.map((c, k) => {
          const d = k - at;
          const far = Math.abs(d);
          return (
            <motion.div
              key={c}
              id={`deep-${String(k)}`}
              role="option"
              aria-selected={d === 0}
              onClick={() => {
                setAt(k);
              }}
              animate={{ x: d * 70, scale: 1 - far * 0.14, opacity: far > 2 ? 0 : 1 - far * 0.3 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              style={{ zIndex: 10 - far }}
              className={`absolute top-0 left-1/2 -ml-20 grid h-48 w-40 cursor-pointer place-items-end rounded-lg border p-3 ${d === 0 ? "border-(--em-blue-500) bg-(--em-blue-800)" : "border-(--em-ink-700) bg-(--em-ink-850)"}`}
            >
              <span className="text-sm font-semibold text-(--em-ink-0)">{c}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
