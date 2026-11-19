"use client";

import { motion } from "motion/react";
import { useState } from "react";

const people = [
  { n: "นิล", c: "bg-(--em-blue-600)" },
  { n: "ฟ้า", c: "bg-(--em-sky-500)" },
  { n: "ต้น", c: "bg-(--em-teal-600)" },
  { n: "มิ้นท์", c: "bg-(--em-violet-600)" },
  { n: "บอส", c: "bg-(--em-coral-500)" },
  { n: "แพร", c: "bg-(--em-gold-500)" },
  { n: "เจ", c: "bg-(--em-blue-800)" },
  { n: "ปุ๊", c: "bg-(--em-fuchsia-500)" },
];

/** Overlapping avatars that spread apart when pointed at; each one lifts and shows its name. */
export default function AvatarStack({ count = 5 }: { count?: number }) {
  const n = Math.min(8, Math.max(3, Math.round(count)));
  const shown = people.slice(0, n);
  const [open, setOpen] = useState(false);
  const [hot, setHot] = useState<number | null>(null);
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <ul
        aria-label={`ทีม ${String(n)} คน`}
        onPointerEnter={() => {
          setOpen(true);
        }}
        onPointerLeave={() => {
          setOpen(false);
          setHot(null);
        }}
        className="flex"
      >
        {shown.map((p, i) => (
          <motion.li
            key={p.n}
            animate={{ x: open ? (i - (n - 1) / 2) * 20 : 0, y: hot === i ? -8 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            style={{ zIndex: hot === i ? 20 : n - i }}
            className="relative -ml-3.5 first:ml-0"
          >
            <button
              type="button"
              aria-label={p.n}
              onPointerEnter={() => {
                setHot(i);
              }}
              onFocus={() => {
                setOpen(true);
                setHot(i);
              }}
              className={`grid size-12 place-items-center rounded-full border-2 border-(--em-ink-975) text-sm font-bold text-(--em-ink-0) ${p.c}`}
            >
              {p.n.slice(0, 1)}
            </button>
            {hot === i && (
              <span className="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2">
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="block rounded-md bg-(--em-ink-50) px-2 py-0.5 text-xs whitespace-nowrap text-(--em-ink-950)"
                >
                  {p.n}
                </motion.span>
              </span>
            )}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
