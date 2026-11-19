"use client";

import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/** A command chip whose copy icon turns into a tick for two seconds after it is pressed. */
export default function CopyMorph({ value = "pnpm add @empire/ui" }: { value?: string }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      setDone(false);
    }, 2000);
    return () => {
      clearTimeout(t);
    };
  }, [done]);

  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div className="flex max-w-full items-center gap-3 rounded-lg border border-(--em-ink-800) bg-(--em-ink-900) py-2 pr-2 pl-4">
        <code className="truncate font-mono text-sm text-(--em-ink-100)">
          <span className="text-(--em-sky-400)">$ </span>
          {value}
        </code>
        <button
          type="button"
          aria-label={done ? "คัดลอกแล้ว" : "คัดลอก"}
          onClick={() => {
            void navigator.clipboard.writeText(value).then(() => {
              setDone(true);
            });
          }}
          className="relative grid size-9 shrink-0 place-items-center rounded-md bg-(--em-ink-800) text-(--em-ink-100) transition-colors hover:bg-(--em-ink-700)"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={done ? "y" : "n"}
              initial={{ scale: 0, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: 90, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
            >
              {done ? (
                <Check aria-hidden className="size-4 text-(--em-teal-400)" />
              ) : (
                <Copy aria-hidden className="size-4" />
              )}
            </motion.span>
          </AnimatePresence>
        </button>
        <span className="sr-only" aria-live="polite">
          {done ? "คัดลอกแล้ว" : ""}
        </span>
      </div>
    </div>
  );
}
