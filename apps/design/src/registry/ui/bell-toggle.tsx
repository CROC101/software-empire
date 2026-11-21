"use client";

import { Bell, BellOff } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

/** A bell button that rings when you switch notices on and goes quiet with a slash when off. */
export default function BellToggle({ size = 28 }: { size?: number }) {
  const [on, setOn] = useState(false);
  const Icon = on ? Bell : BellOff;
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          aria-pressed={on}
          aria-label="การแจ้งเตือน"
          onClick={() => {
            setOn(!on);
          }}
          className={`grid place-items-center rounded-xl p-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--em-sky-400) ${on ? "bg-(--em-blue-600) text-(--em-ink-0)" : "bg-(--em-ink-800) text-(--em-ink-400)"}`}
        >
          <motion.span
            key={String(on)}
            style={{ originY: 0 }}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1, rotate: on ? [0, 18, -16, 12, -8, 4, 0] : 0 }}
            transition={{ duration: 0.7 }}
          >
            <Icon style={{ width: size, height: size }} strokeWidth={1.5} />
          </motion.span>
        </button>
        <span className="text-sm text-(--em-ink-400)">{on ? "เปิดแจ้งเตือน" : "ปิดแจ้งเตือน"}</span>
      </div>
    </div>
  );
}
