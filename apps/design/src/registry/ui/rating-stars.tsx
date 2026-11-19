"use client";

import { Star } from "lucide-react";
import { motion } from "motion/react";
import { useId, useState } from "react";

/** Star rating on native radios (arrow keys work); stars light up to the pointer and pop when chosen. */
export default function RatingStars({ max = 5 }: { max?: number }) {
  const n = Math.min(10, Math.max(3, Math.round(max)));
  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(0);
  const id = useId();
  const lit = hover || value;
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <fieldset
        onPointerLeave={() => {
          setHover(0);
        }}
        className="flex flex-col items-center gap-3"
      >
        <legend className="sr-only">ให้คะแนน</legend>
        <div className="flex flex-wrap justify-center gap-1">
          {Array.from({ length: n }, (_, i) => i + 1).map((s) => (
            <label
              key={s}
              onPointerEnter={() => {
                setHover(s);
              }}
              className="cursor-pointer rounded-md p-1 has-focus-visible:outline-2 has-focus-visible:outline-(--em-sky-400)"
            >
              <input
                type="radio"
                name={id}
                value={s}
                checked={value === s}
                onChange={() => {
                  setValue(s);
                }}
                className="sr-only"
              />
              <span className="sr-only">{s} ดาว</span>
              <motion.span
                className="block"
                animate={{
                  scale: value === s ? [1, 1.4, 1] : 1,
                  rotate: value === s ? [0, 15, 0] : 0,
                }}
                transition={{ duration: 0.35 }}
              >
                <Star
                  aria-hidden
                  className={`size-8 transition-colors duration-150 ${s <= lit ? "fill-(--em-gold-300) text-(--em-gold-300)" : "text-(--em-ink-600)"}`}
                />
              </motion.span>
            </label>
          ))}
        </div>
        <p aria-live="polite" className="text-sm text-(--em-ink-300)">
          {value ? `${String(value)} จาก ${String(n)}` : "ยังไม่ให้คะแนน"}
        </p>
      </fieldset>
    </div>
  );
}
