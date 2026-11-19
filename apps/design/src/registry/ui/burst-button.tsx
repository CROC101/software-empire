"use client";

import { Heart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const colors = [
  "var(--em-sky-400)",
  "var(--em-blue-400)",
  "var(--em-coral-400)",
  "var(--em-gold-300)",
];

/** Press: the button squashes, the heart fills and sparks fly out in a ring. Press again to undo. */
export default function BurstButton({
  label = "ถูกใจ",
  count = 12,
}: {
  label?: string;
  count?: number;
}) {
  const [liked, setLiked] = useState(false);
  const [burst, setBurst] = useState(0);

  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <motion.button
        type="button"
        aria-pressed={liked}
        whileTap={{ scale: 0.85 }}
        onClick={() => {
          setLiked((l) => !l);
          if (!liked) setBurst((b) => b + 1);
        }}
        className="relative inline-flex items-center gap-2 rounded-lg border border-(--em-ink-700) bg-(--em-ink-900) px-6 py-3 font-semibold text-(--em-ink-50)"
      >
        <span className="relative grid place-items-center">
          <Heart
            aria-hidden
            className={`size-5 transition-colors ${liked ? "fill-(--em-coral-500) text-(--em-coral-500)" : "text-(--em-ink-300)"}`}
          />
          <AnimatePresence>
            {burst > 0 &&
              Array.from({ length: count }, (_, i) => {
                const a = (i / count) * Math.PI * 2;
                return (
                  <motion.span
                    key={`${String(burst)}-${String(i)}`}
                    aria-hidden
                    className="absolute size-1.5 rounded-full"
                    style={{ background: colors[i % colors.length] }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{ x: Math.cos(a) * 34, y: Math.sin(a) * 34, opacity: 0, scale: 0.3 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                );
              })}
          </AnimatePresence>
        </span>
        {label}
      </motion.button>
    </div>
  );
}
