"use client";

import { ChevronDown, Copy, Pencil, Share2, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

const items = [
  { label: "แก้ไข", icon: Pencil },
  { label: "ทำสำเนา", icon: Copy },
  { label: "แชร์", icon: Share2 },
  { label: "ลบ", icon: Trash2, danger: true },
];

/** A menu that unfolds item by item. Arrow keys move, Enter picks, Esc closes and returns focus. */
export default function DropdownMenu() {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (open) refs.current[0]?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const keys = (e: KeyboardEvent) => {
    const i = refs.current.findIndex((r) => r === document.activeElement);
    if (e.key === "ArrowDown") refs.current[(i + 1) % items.length]?.focus();
    if (e.key === "ArrowUp") refs.current[(i - 1 + items.length) % items.length]?.focus();
    if (e.key === "Escape") close();
    if (e.key.startsWith("Arrow")) e.preventDefault();
  };

  return (
    <div className="grid size-full min-h-80 place-items-start justify-center bg-(--em-ink-975) p-6 pt-12">
      <div className="relative">
        <button
          ref={trigger}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => {
            setOpen((o) => !o);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-(--em-ink-700) bg-(--em-ink-900) px-4 py-2.5 text-sm font-semibold text-(--em-ink-50)"
        >
          {picked ?? "ตัวเลือก"}
          <motion.span animate={{ rotate: open ? 180 : 0 }}>
            <ChevronDown aria-hidden className="size-4" />
          </motion.span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              id={id}
              role="menu"
              onKeyDown={keys}
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              className="absolute top-full left-0 z-10 mt-2 w-48 origin-top-left rounded-lg border border-(--em-ink-700) bg-(--em-ink-900) p-1 shadow-2xl"
            >
              {items.map((it, i) => {
                const Icon = it.icon;
                return (
                  <motion.button
                    key={it.label}
                    ref={(el) => {
                      refs.current[i] = el;
                    }}
                    role="menuitem"
                    type="button"
                    tabIndex={-1}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => {
                      setPicked(it.label);
                      close();
                    }}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm outline-none focus:bg-(--em-ink-800) ${it.danger ? "text-(--em-coral-400)" : "text-(--em-ink-100)"}`}
                  >
                    <Icon aria-hidden className="size-4" />
                    {it.label}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
