"use client";

import { motion } from "motion/react";
import { useState } from "react";

const times = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
const ROW = 40;

/** A picker drum: options sit on a turning cylinder, the middle one is the choice. Wheel, drag or arrow keys. */
export default function OptionWheel() {
  const [at, setAt] = useState(3);
  const go = (n: number) => {
    setAt(Math.max(0, Math.min(times.length - 1, n)));
  };
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <div className="flex flex-col items-center gap-3">
        <div
          role="listbox"
          tabIndex={0}
          aria-label="เวลานัด"
          aria-activedescendant={`wheel-${String(at)}`}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") go(at + 1);
            else if (e.key === "ArrowUp") go(at - 1);
          }}
          onWheel={(e) => {
            go(at + Math.sign(e.deltaY));
          }}
          className="relative h-52 w-40 overflow-hidden rounded-lg border border-(--em-ink-800) bg-(--em-ink-900) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
          style={{ perspective: 600 }}
        >
          <span
            aria-hidden
            className="absolute inset-x-2 top-1/2 h-10 -translate-y-1/2 rounded-md bg-(--em-ink-800)"
          />
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.4}
            onDragEnd={(_, info) => {
              go(at - Math.round(info.offset.y / ROW));
            }}
            className="absolute inset-x-0 top-1/2 cursor-grab"
          >
            {times.map((t, k) => {
              const d = k - at;
              return (
                <motion.div
                  key={t}
                  id={`wheel-${String(k)}`}
                  role="option"
                  aria-selected={d === 0}
                  onClick={() => {
                    go(k);
                  }}
                  animate={{
                    y: d * ROW - ROW / 2,
                    rotateX: d * -22,
                    opacity: Math.abs(d) > 2 ? 0 : 1 - Math.abs(d) * 0.3,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`absolute inset-x-0 grid h-10 place-items-center font-mono text-lg tabular-nums ${d === 0 ? "text-(--em-ink-0)" : "text-(--em-ink-400)"}`}
                >
                  {t}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
        <p className="text-sm text-(--em-ink-300)" aria-live="polite">
          นัดเวลา {times[at]} น.
        </p>
      </div>
    </div>
  );
}
