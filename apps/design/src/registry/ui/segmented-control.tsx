"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";

const options = ["รายวัน", "รายเดือน", "รายปี"];

/** A segmented switch built on native radios: the thumb glides between choices, arrow keys work for free. */
export default function SegmentedControl() {
  const [value, setValue] = useState(1);
  const id = useId();
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <fieldset className="flex rounded-lg bg-(--em-ink-900) p-1 ring-1 ring-(--em-ink-800)">
        <legend className="sr-only">รอบการจ่าย</legend>
        {options.map((o, i) => (
          <label
            key={o}
            className={`relative cursor-pointer rounded-md px-5 py-2 text-sm font-semibold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-(--em-sky-400) ${value === i ? "text-(--em-ink-950)" : "text-(--em-ink-300) hover:text-(--em-ink-100)"}`}
          >
            <input
              type="radio"
              name={id}
              checked={value === i}
              onChange={() => {
                setValue(i);
              }}
              className="sr-only"
            />
            {value === i && (
              <motion.span
                layoutId={`${id}-thumb`}
                className="absolute inset-0 rounded-md bg-(--em-ink-50) shadow"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative">{o}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
