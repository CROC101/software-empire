"use client";

import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const items = ["หน้าแรก", "ผลงาน", "บริการ", "ราคา", "ติดต่อ"];

/** A round menu button that blows a column of pill bubbles out over the page, each with a little bounce. */
export default function BubbleBurstMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative grid size-full min-h-80 place-items-center overflow-hidden bg-(--em-ink-975) p-6">
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="bubble-burst-list"
          aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
          onClick={() => {
            setOpen(!open);
          }}
          className="grid size-12 place-items-center rounded-full bg-(--em-ink-0) text-(--em-ink-900) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--em-sky-400)"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <ul id="bubble-burst-list" className="flex flex-col items-center gap-2">
          <AnimatePresence>
            {open &&
              items.map((it, k) => (
                <motion.li
                  key={it}
                  initial={{ scale: 0, y: -20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18, delay: k * 0.05 }}
                >
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                    }}
                    className="block rounded-full bg-(--em-ink-800) px-6 py-2 text-base font-semibold text-(--em-ink-0) hover:bg-(--em-blue-700) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
                  >
                    {it}
                  </a>
                </motion.li>
              ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
