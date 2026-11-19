"use client";

import { motion } from "motion/react";
import { useState } from "react";

const items = [
  { title: "ทะเล", tone: "from-(--em-blue-500) to-(--em-blue-900)" },
  { title: "ป่า", tone: "from-(--em-teal-400) to-(--em-ink-900)" },
  { title: "เมือง", tone: "from-(--em-violet-500) to-(--em-ink-900)" },
  { title: "ฟ้า", tone: "from-(--em-sky-400) to-(--em-blue-800)" },
  { title: "ทราย", tone: "from-(--em-gold-500) to-(--em-ink-900)" },
];

/** A row of cards: the one you point at (or focus) widens and shows its caption; the others narrow. */
export default function ExpandCards() {
  const [open, setOpen] = useState(0);
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <div className="flex h-64 w-full max-w-2xl gap-2">
        {items.map((it, i) => (
          <motion.button
            key={it.title}
            type="button"
            layout
            onPointerEnter={() => {
              setOpen(i);
            }}
            onFocus={() => {
              setOpen(i);
            }}
            aria-expanded={open === i}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            style={{ flexGrow: open === i ? 5 : 1, flexBasis: 0 }}
            className={`relative min-w-10 overflow-hidden rounded-xl bg-linear-to-b text-left ${it.tone}`}
          >
            <motion.span
              layout="position"
              className="absolute bottom-4 left-4 font-heading text-xl font-black whitespace-nowrap text-(--em-ink-0)"
              animate={{ opacity: open === i ? 1 : 0, y: open === i ? 0 : 10 }}
            >
              {it.title}
            </motion.span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
