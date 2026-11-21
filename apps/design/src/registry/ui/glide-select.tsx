"use client";

import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";

const options = ["เว็บไซต์", "แอปมือถือ", "โลโก้", "วิดีโอสั้น", "ที่ปรึกษา"];

/** A select whose highlight glides between options as you move, and whose list unfolds from the trigger. */
export default function GlideSelect() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(0);
  const [hot, setHot] = useState(0);
  const choose = (i: number) => {
    setValue(i);
    setOpen(false);
  };
  return (
    <div className="grid size-full min-h-80 place-items-start justify-center bg-(--em-ink-975) p-6 pt-10">
      <div className="relative w-56">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          onClick={() => {
            setHot(value);
            setOpen(!open);
          }}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              const d = e.key === "ArrowDown" ? 1 : -1;
              setHot((h) => (h + d + options.length) % options.length);
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(hot);
            } else if (e.key === "Escape") setOpen(false);
          }}
          className="flex w-full items-center justify-between rounded-lg border border-(--em-ink-700) bg-(--em-ink-900) px-3 py-2.5 text-sm text-(--em-ink-100) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
        >
          {options[value]}
          <motion.span animate={{ rotate: open ? 180 : 0 }}>
            <ChevronDown className="size-4 text-(--em-ink-400)" />
          </motion.span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.ul
              id={`${id}-list`}
              role="listbox"
              aria-activedescendant={`${id}-${String(hot)}`}
              initial={{ opacity: 0, y: -6, scaleY: 0.9 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -6, scaleY: 0.9 }}
              style={{ originY: 0 }}
              className="absolute inset-x-0 top-full mt-2 flex flex-col rounded-lg border border-(--em-ink-800) bg-(--em-ink-900) p-1"
            >
              {options.map((o, i) => (
                <li
                  key={o}
                  id={`${id}-${String(i)}`}
                  role="option"
                  aria-selected={value === i}
                  onPointerEnter={() => {
                    setHot(i);
                  }}
                  onClick={() => {
                    choose(i);
                  }}
                  className="relative flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-(--em-ink-200)"
                >
                  {hot === i && (
                    <motion.span
                      layoutId={`${id}-hot`}
                      className="absolute inset-0 rounded-md bg-(--em-ink-800)"
                      transition={{ type: "spring", stiffness: 500, damping: 36 }}
                    />
                  )}
                  <span className="relative">{o}</span>
                  {value === i && <Check className="relative size-4 text-(--em-sky-400)" />}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
