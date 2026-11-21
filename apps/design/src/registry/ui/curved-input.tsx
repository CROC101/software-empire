"use client";

import { motion } from "motion/react";
import { useState } from "react";

/** A text field whose underline sags into a curve under the caret while you type, then springs flat. */
export default function CurvedInput({ bend = 14 }: { bend?: number }) {
  const [value, setValue] = useState("");
  const [focus, setFocus] = useState(false);
  const [beat, setBeat] = useState(0);
  // the dip sits roughly under the last letter typed
  const at = Math.min(300, 16 + value.length * 9);
  const dip = focus ? bend : 0;
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <label className="flex w-full max-w-xs flex-col gap-2">
        <span className="text-sm text-(--em-ink-300)">อีเมลสำหรับติดต่อกลับ</span>
        <input
          type="email"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setBeat(beat + 1);
          }}
          onFocus={() => {
            setFocus(true);
          }}
          onBlur={() => {
            setFocus(false);
          }}
          placeholder="name@example.com"
          className="bg-transparent px-1 py-2 text-lg text-(--em-ink-0) placeholder:text-(--em-ink-600) focus:outline-none"
        />
        <svg
          aria-hidden
          viewBox="0 0 320 24"
          className="h-6 w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <motion.path
            key={beat % 2}
            initial={{ d: `M0 4 Q${String(at)} ${String(4 + dip * 1.6)} 320 4` }}
            animate={{ d: `M0 4 Q${String(at)} ${String(4 + dip)} 320 4` }}
            transition={{ type: "spring", stiffness: 260, damping: 12 }}
            fill="none"
            strokeWidth={2}
            className={focus ? "stroke-(--em-sky-400)" : "stroke-(--em-ink-600)"}
          />
        </svg>
      </label>
    </div>
  );
}
