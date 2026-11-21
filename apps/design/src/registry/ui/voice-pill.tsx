"use client";

import { Mic, Square } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

/** A pill that opens into a live level meter and timer while you talk, and folds back when you stop. */
export default function VoicePill({ bars = 5 }: { bars?: number }) {
  const [on, setOn] = useState(false);
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => {
      setSec((s) => s + 1);
    }, 1000);
    return () => {
      clearInterval(t);
    };
  }, [on]);
  const time = `${String(Math.floor(sec / 60))}:${String(sec % 60).padStart(2, "0")}`;
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <motion.button
        layout
        type="button"
        aria-pressed={on}
        onClick={() => {
          if (!on) setSec(0);
          setOn(!on);
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={`flex h-12 items-center gap-3 rounded-full px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--em-sky-400) ${on ? "bg-(--em-blue-600) text-(--em-ink-0)" : "bg-(--em-ink-800) text-(--em-ink-100)"}`}
      >
        <motion.span layout="position">
          {on ? <Square className="size-4" /> : <Mic className="size-4" />}
        </motion.span>
        {on ? (
          <>
            <span aria-hidden className="vt-live flex h-6 items-center gap-1">
              {Array.from({ length: bars }, (_, i) => (
                <motion.span
                  key={i}
                  className="block h-6 w-1 rounded-full bg-(--em-ink-0)"
                  animate={{ scaleY: [0.25, 1, 0.4, 0.8, 0.25] }}
                  transition={{ duration: 0.9 + (i % 3) * 0.2, repeat: Infinity, delay: i * 0.08 }}
                />
              ))}
            </span>
            <span className="font-mono tabular-nums">{time}</span>
          </>
        ) : (
          <motion.span layout="position">กดเพื่อพูด</motion.span>
        )}
      </motion.button>
    </div>
  );
}
