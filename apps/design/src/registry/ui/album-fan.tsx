"use client";

import { motion } from "motion/react";
import { useState } from "react";

const covers = [
  { title: "น้ำขึ้น", tone: "from-(--em-sky-400) to-(--em-blue-700)" },
  { title: "ลมหนาว", tone: "from-(--em-ink-200) to-(--em-blue-800)" },
  { title: "ไฟเมือง", tone: "from-(--em-coral-500) to-(--em-violet-700)" },
  { title: "ฝนพรำ", tone: "from-(--em-blue-700) to-(--em-ink-950)" },
  { title: "แดดบ่าย", tone: "from-(--em-gold-300) to-(--em-coral-500)" },
];

/** A stack of album covers that fans out like a hand of cards on hover or focus; the pointed one lifts. */
export default function AlbumFan() {
  const [open, setOpen] = useState(false);
  const [hot, setHot] = useState<number | null>(null);
  const mid = (covers.length - 1) / 2;
  return (
    <div className="grid size-full min-h-80 place-items-center overflow-hidden bg-(--em-ink-975) p-6">
      <ul
        aria-label="อัลบั้ม"
        onPointerEnter={() => {
          setOpen(true);
        }}
        onPointerLeave={() => {
          setOpen(false);
          setHot(null);
        }}
        onFocus={() => {
          setOpen(true);
        }}
        onBlur={() => {
          setOpen(false);
          setHot(null);
        }}
        className="relative h-44 w-36"
      >
        {covers.map((c, i) => {
          const off = i - mid;
          return (
            <motion.li
              key={c.title}
              className="absolute inset-0 origin-bottom"
              animate={{
                rotate: open ? off * 12 : off * 2,
                x: open ? off * 46 : off * 3,
                y: hot === i ? -24 : open ? Math.abs(off) * 8 : 0,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              style={{ zIndex: hot === i ? 20 : i }}
            >
              <button
                type="button"
                aria-label={c.title}
                onPointerEnter={() => {
                  setHot(i);
                }}
                onFocus={() => {
                  setHot(i);
                }}
                className={`flex size-full flex-col justify-end rounded-lg border border-(--em-ink-0)/10 bg-linear-to-br p-3 text-left shadow-2xl ${c.tone}`}
              >
                <span className="font-heading text-lg font-black text-(--em-ink-0)">{c.title}</span>
                <span className="font-mono text-[10px] tracking-[0.2em] text-(--em-ink-0)/70 uppercase">
                  vol. {i + 1}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
