"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";

/** A switch whose knob stretches while pressed, then springs to the other side. */
export default function ToggleSwitch({ label = "แจ้งเตือน" }: { label?: string }) {
  const [on, setOn] = useState(false);
  const id = useId();
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div className="flex items-center gap-4">
        <label htmlFor={id} className="text-sm font-medium text-(--em-ink-100)">
          {label}
        </label>
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => {
            setOn((v) => !v);
          }}
          className={`flex h-8 w-14 items-center rounded-full p-1 transition-colors duration-300 ${on ? "justify-end bg-(--em-blue-600)" : "justify-start bg-(--em-ink-700)"}`}
        >
          <motion.span
            layout
            whileTap={{ scaleX: 1.35 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="block size-6 rounded-full bg-(--em-ink-0) shadow"
          />
        </button>
      </div>
    </div>
  );
}
