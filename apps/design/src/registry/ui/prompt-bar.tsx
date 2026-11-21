"use client";

import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

/** A prompt box: it widens when focused, the send arrow lifts, and what you sent rises above it. */
export default function PromptBar({ placeholder = "ถามอะไรก็ได้" }: { placeholder?: string }) {
  const [value, setValue] = useState("");
  const [sent, setSent] = useState<{ id: number; text: string }[]>([]);
  const n = useRef(0);
  return (
    <div className="grid size-full min-h-64 place-items-center bg-(--em-ink-975) p-6">
      <div className="flex w-full max-w-sm flex-col gap-3">
        <ul className="flex min-h-24 flex-col items-end justify-end gap-2">
          <AnimatePresence initial={false}>
            {sent.map((m) => (
              <motion.li
                key={m.id}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-lg bg-(--em-blue-600) px-3 py-1.5 text-sm text-(--em-ink-0)"
              >
                {m.text}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const text = value.trim();
            if (!text) return;
            setSent((s) => [...s.slice(-2), { id: n.current++, text }]);
            setValue("");
          }}
          className="group flex items-center gap-2 rounded-xl border border-(--em-ink-700) bg-(--em-ink-900) p-1.5 pl-3 transition-colors focus-within:border-(--em-blue-500)"
        >
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            maxLength={120}
            className="min-w-0 flex-1 bg-transparent text-sm text-(--em-ink-100) outline-none placeholder:text-(--em-ink-500)"
          />
          <motion.button
            type="submit"
            aria-label="ส่ง"
            disabled={!value.trim()}
            animate={{ y: value.trim() ? 0 : 2, opacity: value.trim() ? 1 : 0.4 }}
            whileTap={{ y: -4 }}
            className="grid size-8 place-items-center rounded-lg bg-(--em-blue-600) text-(--em-ink-0) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
          >
            <ArrowUp className="size-4" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
