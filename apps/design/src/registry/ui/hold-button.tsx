"use client";

import { motion } from "motion/react";
import { useState } from "react";

/** A button you press and hold until it fills; let go early and it drains back. */
export default function HoldButton({ seconds = 1.2 }: { seconds?: number }) {
  const [held, setHeld] = useState(false);
  const [done, setDone] = useState(false);
  const press = () => {
    if (!done) setHeld(true);
  };
  const release = () => {
    setHeld(false);
  };
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onPointerDown={press}
          onPointerUp={release}
          onPointerLeave={release}
          onKeyDown={(e) => {
            if ((e.key === " " || e.key === "Enter") && !e.repeat) {
              e.preventDefault();
              press();
            }
          }}
          onKeyUp={release}
          onBlur={release}
          className="relative h-12 w-48 touch-none overflow-hidden rounded-lg bg-(--em-ink-800) text-sm font-semibold text-(--em-ink-0) select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--em-sky-400)"
        >
          <motion.span
            aria-hidden
            className={`absolute inset-0 origin-left ${done ? "bg-(--em-danger)" : "bg-(--em-danger)/70"}`}
            initial={false}
            animate={{ scaleX: held || done ? 1 : 0 }}
            transition={held ? { duration: seconds, ease: "linear" } : { duration: 0.25 }}
            onAnimationComplete={() => {
              if (held) {
                setHeld(false);
                setDone(true);
              }
            }}
          />
          <span className="relative">{done ? "ลบโปรเจกต์แล้ว" : "กดค้างเพื่อลบ"}</span>
        </button>
        {done && (
          <button
            type="button"
            onClick={() => {
              setDone(false);
            }}
            className="rounded-md px-3 py-1 text-xs text-(--em-ink-400) underline focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
          >
            เรียกคืน
          </button>
        )}
      </div>
    </div>
  );
}
