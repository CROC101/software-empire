"use client";

import { motion } from "motion/react";
import { useState } from "react";

const rand = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const months = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

/** Bars rise from the baseline one after another (scaleY). Point at a bar to read its value. */
export default function BarRise({ bars = 7 }: { bars?: number }) {
  const n = Math.min(12, Math.max(4, Math.round(bars)));
  const data = Array.from({ length: n }, (_, i) => Math.round(30 + rand(i + 1) * 70));
  const [hot, setHot] = useState<number | null>(null);
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <figure className="w-full max-w-md">
        <figcaption className="mb-4 flex items-baseline justify-between">
          <span className="font-semibold text-(--em-ink-50)">ยอดเข้าชม</span>
          <span aria-live="polite" className="font-mono text-sm text-(--em-sky-400)">
            {hot === null ? "" : `${months[hot] ?? ""} ${String(data[hot] ?? 0)}k`}
          </span>
        </figcaption>
        <ul className="flex h-44 items-end gap-2 border-b border-(--em-ink-700)">
          {data.map((v, i) => (
            <li key={i} className="flex h-full flex-1 flex-col justify-end">
              <motion.button
                type="button"
                aria-label={`${months[i] ?? ""} ${String(v)}k`}
                onPointerEnter={() => {
                  setHot(i);
                }}
                onPointerLeave={() => {
                  setHot(null);
                }}
                onFocus={() => {
                  setHot(i);
                }}
                onBlur={() => {
                  setHot(null);
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.07, type: "spring", stiffness: 120, damping: 16 }}
                style={{ height: `${String(v)}%` }}
                className={`w-full origin-bottom rounded-t-md transition-colors ${hot === i ? "bg-(--em-sky-400)" : "bg-(--em-blue-600)"}`}
              />
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2" aria-hidden>
          {data.map((_, i) => (
            <span key={i} className="flex-1 text-center text-[10px] text-(--em-ink-400)">
              {months[i]}
            </span>
          ))}
        </div>
      </figure>
    </div>
  );
}
