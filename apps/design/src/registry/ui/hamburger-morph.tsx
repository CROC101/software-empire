"use client";

import { motion } from "motion/react";
import { useState } from "react";

const links = ["ผลงาน", "บริการ", "ราคา", "ติดต่อ"];

/** Three bars fold into a cross; the menu links rise in one after another. */
export default function HamburgerMorph() {
  const [open, setOpen] = useState(false);
  const bar = "absolute left-2.5 h-0.5 w-6 rounded-full bg-(--em-ink-50)";
  return (
    <div className="flex size-full min-h-72 flex-col items-center justify-center gap-6 bg-(--em-ink-975) p-6">
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
        onClick={() => {
          setOpen((o) => !o);
        }}
        className="relative size-11 rounded-lg border border-(--em-ink-700) bg-(--em-ink-900)"
      >
        <motion.span
          className={bar}
          style={{ top: 14 }}
          animate={open ? { y: 7, rotate: 45 } : { y: 0, rotate: 0 }}
        />
        <motion.span
          className={bar}
          style={{ top: 21 }}
          animate={{ opacity: open ? 0 : 1, scaleX: open ? 0 : 1 }}
        />
        <motion.span
          className={bar}
          style={{ top: 28 }}
          animate={open ? { y: -7, rotate: -45 } : { y: 0, rotate: 0 }}
        />
      </button>
      <nav aria-label="เมนูตัวอย่าง" className="h-40">
        {open && (
          <ul className="flex flex-col items-center gap-2">
            {links.map((l, i) => (
              <motion.li
                key={l}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 24 }}
              >
                <a
                  href="#top"
                  className="font-heading text-2xl font-black text-(--em-ink-50) hover:text-(--em-sky-400)"
                >
                  {l}
                </a>
              </motion.li>
            ))}
          </ul>
        )}
      </nav>
    </div>
  );
}
