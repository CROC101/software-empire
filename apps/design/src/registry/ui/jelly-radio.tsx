"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";

const plans = ["รายเดือน", "รายปี", "ตลอดชีพ"];

/** Radio buttons whose dot travels to the new choice and lands with a soft squash. */
export default function JellyRadio() {
  const id = useId();
  const [pick, setPick] = useState(1);
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm text-(--em-ink-400)">แพ็กเกจ</legend>
        {plans.map((p, i) => (
          <label
            key={p}
            className="flex cursor-pointer items-center gap-3 text-sm text-(--em-ink-100)"
          >
            <input
              type="radio"
              name={id}
              checked={pick === i}
              onChange={() => {
                setPick(i);
              }}
              className="peer sr-only"
            />
            <span className="grid size-5 place-items-center rounded-full border-2 border-(--em-ink-600) peer-checked:border-(--em-blue-500) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--em-sky-400)">
              {pick === i && (
                <motion.span
                  layoutId={`${id}-dot`}
                  className="block size-2.5 rounded-full bg-(--em-blue-500)"
                  transition={{ type: "spring", stiffness: 500, damping: 26 }}
                  animate={{ scaleX: [1, 1.35, 0.9, 1], scaleY: [1, 0.7, 1.1, 1] }}
                />
              )}
            </span>
            {p}
          </label>
        ))}
      </fieldset>
    </div>
  );
}
