"use client";

import { motion } from "motion/react";

const rand = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const tones = [
  "from-(--em-blue-600) to-(--em-blue-900)",
  "from-(--em-sky-400) to-(--em-blue-700)",
  "from-(--em-violet-500) to-(--em-ink-950)",
  "from-(--em-teal-400) to-(--em-blue-800)",
  "from-(--em-ink-600) to-(--em-ink-900)",
];

/** A CSS-columns masonry wall; each tile rises out of the water as it scrolls into view. */
export default function MasonryRise() {
  return (
    <div className="h-96 overflow-y-auto bg-(--em-ink-975) p-6 @container">
      <ul className="columns-2 gap-3 @md:columns-3">
        {Array.from({ length: 12 }, (_, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: "spring", stiffness: 140, damping: 18, delay: (i % 3) * 0.06 }}
            className={`mb-3 break-inside-avoid rounded-lg bg-linear-to-br p-3 ${tones[i % tones.length] ?? ""}`}
            style={{ height: `${String(Math.round(90 + rand(i + 1) * 120))}px` }}
          >
            <span className="font-mono text-xs text-(--em-ink-0)/70">
              #{String(i + 1).padStart(2, "0")}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
