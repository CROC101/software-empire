"use client";

import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const labels = ["หน้าแรก", "ผลงาน", "บริการ", "บทความ", "ติดต่อ", "ร้านค้า"];

/** A menu whose items grow out of the button on branches that draw themselves. */
export default function BranchMenu({ items = 4 }: { items?: number }) {
  const [open, setOpen] = useState(false);
  const list = labels.slice(0, items);
  const ys = list.map((_, i) => 120 + (i - (list.length - 1) / 2) * 42);
  return (
    <div className="grid size-full min-h-64 place-items-center bg-(--em-ink-975) p-6">
      <nav className="relative h-60 w-72">
        <svg aria-hidden viewBox="0 0 288 240" className="absolute inset-0 size-full">
          <AnimatePresence>
            {open &&
              ys.map((y, i) => (
                <motion.path
                  key={y}
                  d={`M60 120 C110 120 100 ${String(y)} 150 ${String(y)}`}
                  fill="none"
                  stroke="var(--em-blue-500)"
                  strokeWidth={1.5}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  exit={{ pathLength: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                />
              ))}
          </AnimatePresence>
        </svg>
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
          onClick={() => {
            setOpen(!open);
          }}
          className="absolute top-[100px] left-5 grid size-10 place-items-center rounded-lg bg-(--em-blue-600) text-(--em-ink-0) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--em-sky-400)"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <ul>
          <AnimatePresence>
            {open &&
              list.map((l, i) => (
                <motion.li
                  key={l}
                  className="absolute left-[150px]"
                  style={{ top: (ys[i] ?? 0) - 16 }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                    className="block rounded-md border border-(--em-ink-800) bg-(--em-ink-900) px-3 py-1.5 text-sm text-(--em-ink-100) hover:border-(--em-blue-500) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
                  >
                    {l}
                  </a>
                </motion.li>
              ))}
          </AnimatePresence>
        </ul>
      </nav>
    </div>
  );
}
