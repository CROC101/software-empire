"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

const shots = [
  { title: "ท่าน้ำยามเช้า", tone: "from-(--em-sky-400) to-(--em-blue-700)" },
  { title: "ตลาดน้ำ", tone: "from-(--em-gold-500) to-(--em-coral-500)" },
  { title: "ฝนตกหน้าบ้าน", tone: "from-(--em-blue-800) to-(--em-ink-950)" },
  { title: "กระทงลอย", tone: "from-(--em-violet-500) to-(--em-ink-950)" },
  { title: "หมอกบนดอย", tone: "from-(--em-ink-300) to-(--em-blue-800)" },
  { title: "ทะเลสาบ", tone: "from-(--em-teal-400) to-(--em-blue-800)" },
];

/** Thumbnails grow into a full view with a shared-element move; Esc, the cross or the backdrop shrink them back. */
export default function LightboxGrid() {
  const [open, setOpen] = useState<number | null>(null);
  const id = useId();
  const cur = open === null ? undefined : shots[open];
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open === null) return;
    closeBtn.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div className="relative grid size-full min-h-80 place-items-center overflow-hidden bg-(--em-ink-975) p-6">
      <ul className="grid w-full max-w-md grid-cols-3 gap-2">
        {shots.map((s, i) => (
          <li key={s.title}>
            <motion.button
              type="button"
              layoutId={`${id}-${String(i)}`}
              aria-label={`เปิดภาพ ${s.title}`}
              onClick={() => {
                setOpen(i);
              }}
              className={`block aspect-square w-full rounded-lg bg-linear-to-br ${s.tone}`}
            />
          </li>
        ))}
      </ul>
      <AnimatePresence>
        {cur && open !== null && (
          <motion.div
            key="lb"
            className="absolute inset-0 grid place-items-center bg-(--em-ink-975)/85 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setOpen(null);
            }}
          >
            <motion.figure
              layoutId={`${id}-${String(open)}`}
              role="dialog"
              aria-modal="true"
              aria-label={cur.title}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className={`relative aspect-video w-full max-w-md rounded-xl bg-linear-to-br ${cur.tone}`}
            >
              <figcaption className="absolute bottom-3 left-4 font-heading text-xl font-black text-(--em-ink-0)">
                {cur.title}
              </figcaption>
              <button
                type="button"
                aria-label="ปิด"
                ref={closeBtn}
                onClick={() => {
                  setOpen(null);
                }}
                className="absolute top-2 right-2 grid size-8 place-items-center rounded-md bg-(--em-ink-975)/60 text-(--em-ink-0)"
              >
                <X aria-hidden className="size-4" />
              </button>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
