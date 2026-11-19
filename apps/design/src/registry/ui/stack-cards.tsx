"use client";

import { motion } from "motion/react";
import { useState } from "react";

const deck = [
  { title: "ออกแบบ", note: "โทนน้ำ ฟอนต์ไทยหนา", tone: "from-(--em-blue-600) to-(--em-blue-900)" },
  {
    title: "สร้าง",
    note: "Next 16 + Tailwind 4",
    tone: "from-(--em-violet-500) to-(--em-violet-900)",
  },
  {
    title: "ทดสอบ",
    note: "390 กับ 1440 ทั้งสว่างและมืด",
    tone: "from-(--em-teal-600) to-(--em-ink-900)",
  },
  { title: "ส่งงาน", note: "CI เขียว แล้ว merge", tone: "from-(--em-sky-500) to-(--em-blue-800)" },
];

/** A deck of cards: press the top one and it tucks to the back while the rest move up a step. */
export default function StackCards() {
  const [order, setOrder] = useState(() => deck.map((_, i) => i));

  return (
    <div className="grid size-full min-h-80 place-items-center bg-(--em-ink-975) p-6">
      <div className="relative h-56 w-64">
        {order.map((card, pos) => {
          const c = deck[card];
          if (!c) return null;
          return (
            <motion.button
              key={card}
              type="button"
              tabIndex={pos === 0 ? 0 : -1}
              aria-hidden={pos !== 0}
              aria-label={pos === 0 ? `${c.title}: กดเพื่อไปใบถัดไป` : undefined}
              onClick={() => {
                setOrder((o) => [...o.slice(1), ...o.slice(0, 1)]);
              }}
              animate={{ y: pos * -14, scale: 1 - pos * 0.06, opacity: pos > 2 ? 0 : 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              style={{ zIndex: deck.length - pos }}
              className={`absolute inset-0 flex flex-col justify-end rounded-xl border border-(--em-ink-0)/10 bg-linear-to-br p-5 text-left shadow-2xl ${c.tone}`}
            >
              <span className="font-mono text-xs text-(--em-ink-0)/70">
                {String(card + 1).padStart(2, "0")} / {String(deck.length).padStart(2, "0")}
              </span>
              <span className="font-heading text-2xl font-black text-(--em-ink-0)">{c.title}</span>
              <span className="text-sm text-(--em-ink-0)/80">{c.note}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
