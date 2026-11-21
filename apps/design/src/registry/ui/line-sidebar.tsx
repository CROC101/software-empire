"use client";

import { motion } from "motion/react";
import { useState } from "react";

const links = ["ภาพรวม", "โปรเจกต์", "ลูกค้า", "ใบเสนอราคา", "รายงาน", "ตั้งค่า"];

/** A text-only sidebar on a ruler of ticks; a bright line glides to the page you pick. */
export default function LineSidebar() {
  const [at, setAt] = useState(1);
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <nav aria-label="เมนูข้าง" className="relative w-52 border-l border-(--em-ink-800) py-2">
        {links.map((l, k) => (
          <button
            key={l}
            type="button"
            aria-current={at === k ? "page" : undefined}
            onClick={() => {
              setAt(k);
            }}
            className={`relative block w-full py-2 pl-5 text-left text-sm focus-visible:outline-2 focus-visible:outline-(--em-sky-400) ${at === k ? "text-(--em-ink-0)" : "text-(--em-ink-400) hover:text-(--em-ink-200)"}`}
          >
            <span aria-hidden className="absolute top-1/2 left-0 h-px w-2 bg-(--em-ink-700)" />
            {at === k && (
              <motion.span
                layoutId="line-sidebar-mark"
                aria-hidden
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-y-1 -left-px w-0.5 bg-(--em-sky-400)"
              />
            )}
            {l}
          </button>
        ))}
      </nav>
    </div>
  );
}
