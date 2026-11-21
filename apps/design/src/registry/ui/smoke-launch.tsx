"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

// fixed spread per puff so every launch looks the same and render stays pure
const puffs = Array.from({ length: 14 }, (_, i) => ({
  x: Math.sin(i * 12.9898) * 70,
  rise: 40 + ((i * 37) % 9) * 14,
  size: 36 + ((i * 53) % 5) * 12,
  delay: i * 0.05,
}));

/** A button that lifts off when pressed, leaving a cloud of smoke, then drops back into place. */
export default function SmokeLaunch({ label = "ออกเดินทาง" }: { label?: string }) {
  const still = useReducedMotion();
  const [round, setRound] = useState(0);
  const [flying, setFlying] = useState(false);
  useEffect(() => {
    if (!flying) return;
    const id = setTimeout(() => {
      setFlying(false);
    }, 1600);
    return () => {
      clearTimeout(id);
    };
  }, [flying]);
  return (
    <div className="relative grid size-full min-h-56 place-items-center overflow-hidden bg-(--em-ink-975) p-6">
      <div className="relative">
        <AnimatePresence>
          {round > 0 && (
            <motion.span
              key={round}
              className="pointer-events-none absolute top-full left-1/2"
              exit={{ opacity: 0 }}
            >
              {puffs.map((p, i) => (
                <motion.span
                  key={i}
                  className="absolute -translate-1/2 rounded-full bg-(--em-ink-400) blur-md"
                  style={{ width: p.size, height: p.size }}
                  initial={{ x: 0, y: 0, scale: 0.3, opacity: 0.7 }}
                  animate={{ x: p.x, y: -p.rise, scale: 2.4, opacity: 0 }}
                  transition={{ duration: 2, delay: p.delay, ease: "easeOut" }}
                />
              ))}
            </motion.span>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          aria-label={label}
          disabled={flying}
          onClick={() => {
            if (still) return;
            setRound((r) => r + 1);
            setFlying(true);
          }}
          whileTap={{ scale: 0.96 }}
          animate={flying ? { y: -320, opacity: 0 } : { y: 0, opacity: 1 }}
          transition={
            flying
              ? { duration: 0.9, delay: 0.15, ease: [0.5, 0, 0.9, 0.6] }
              : { type: "spring", stiffness: 260, damping: 18 }
          }
          className="relative rounded-xl bg-(--em-ink-800) px-5 py-3 text-sm text-(--em-ink-0) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--em-sky-400)"
        >
          {label}
        </motion.button>
      </div>
    </div>
  );
}
