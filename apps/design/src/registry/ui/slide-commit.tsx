"use client";

import { ChevronsRight, Check } from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useState } from "react";

const TRACK = 224;

/** A track you slide a handle across to confirm; let go too early and it springs back. */
export default function SlideCommit({ label = "เลื่อนเพื่อยืนยัน" }: { label?: string }) {
  const x = useMotionValue(0);
  const fade = useTransform(x, [0, TRACK * 0.6], [1, 0]);
  const [done, setDone] = useState(false);
  const finish = () => {
    void animate(x, TRACK);
    setDone(true);
  };
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div className="flex flex-col items-center gap-3">
        <div
          className="relative h-12 rounded-lg bg-(--em-ink-800) p-1"
          style={{ width: TRACK + 48 }}
        >
          <motion.span
            style={{ opacity: fade }}
            className="pointer-events-none absolute inset-0 grid place-items-center pl-10 text-sm text-(--em-ink-400)"
          >
            {done ? "" : label}
          </motion.span>
          <motion.button
            type="button"
            aria-label={label}
            disabled={done}
            drag={done ? false : "x"}
            dragConstraints={{ left: 0, right: TRACK }}
            dragElastic={0}
            dragMomentum={false}
            style={{ x }}
            onDragEnd={() => {
              if (x.get() > TRACK * 0.85) finish();
              else void animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                finish();
              }
            }}
            className={`relative grid size-10 cursor-grab touch-none place-items-center rounded-md text-(--em-ink-0) active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-(--em-sky-400) ${done ? "bg-(--em-success)" : "bg-(--em-blue-600)"}`}
          >
            {done ? <Check className="size-5" /> : <ChevronsRight className="size-5" />}
          </motion.button>
        </div>
        <p className="text-xs text-(--em-ink-500)" aria-live="polite">
          {done ? "ยืนยันแล้ว" : ""}
        </p>
        {done && (
          <button
            type="button"
            onClick={() => {
              x.set(0);
              setDone(false);
            }}
            className="rounded-md px-3 py-1 text-xs text-(--em-ink-400) underline focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
          >
            เริ่มใหม่
          </button>
        )}
      </div>
    </div>
  );
}
