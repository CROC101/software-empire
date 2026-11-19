"use client";

import { Bold, Italic, Link2, Underline } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";

const tools = [
  { label: "ตัวหนา", key: "Ctrl B", icon: Bold },
  { label: "ตัวเอียง", key: "Ctrl I", icon: Italic },
  { label: "ขีดเส้นใต้", key: "Ctrl U", icon: Underline },
  { label: "ใส่ลิงก์", key: "Ctrl K", icon: Link2 },
];

/** Tooltips spring up above toolbar buttons on hover or keyboard focus; Esc hides them. */
export default function TooltipFloat() {
  const [tip, setTip] = useState<number | null>(null);
  const id = useId();
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div
        role="toolbar"
        aria-label="จัดรูปแบบ"
        onKeyDown={(e) => {
          if (e.key === "Escape") setTip(null);
        }}
        className="flex gap-1 rounded-lg border border-(--em-ink-800) bg-(--em-ink-900) p-1"
      >
        {tools.map((t, i) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="relative">
              <button
                type="button"
                aria-label={t.label}
                aria-describedby={tip === i ? `${id}-${String(i)}` : undefined}
                onPointerEnter={() => {
                  setTip(i);
                }}
                onPointerLeave={() => {
                  setTip(null);
                }}
                onFocus={() => {
                  setTip(i);
                }}
                onBlur={() => {
                  setTip(null);
                }}
                className="grid size-10 place-items-center rounded-md text-(--em-ink-200) hover:bg-(--em-ink-800)"
              >
                <Icon aria-hidden className="size-4" />
              </button>
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2">
                <AnimatePresence>
                  {tip === i && (
                    <motion.span
                      id={`${id}-${String(i)}`}
                      role="tooltip"
                      initial={{ opacity: 0, y: 6, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="flex items-center gap-2 rounded-md bg-(--em-ink-50) px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-(--em-ink-950)"
                    >
                      {t.label}
                      <kbd className="font-mono text-[10px] text-(--em-ink-500)">{t.key}</kbd>
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
