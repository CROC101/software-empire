"use client";

import { motion } from "motion/react";
import { useState } from "react";

const rand = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const tones = [
  "bg-(--em-ink-800)",
  "bg-(--em-blue-900)",
  "bg-(--em-blue-700)",
  "bg-(--em-blue-500)",
  "bg-(--em-sky-400)",
];
const days = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

/** A contribution grid that fills in column by column; each square shows its count on hover or focus. */
export default function HeatGrid({ weeks = 20 }: { weeks?: number }) {
  const w = Math.min(26, Math.max(8, Math.round(weeks)));
  const [hot, setHot] = useState<string | null>(null);
  return (
    <div className="grid size-full min-h-64 place-items-center bg-(--em-ink-975) p-6">
      <figure className="max-w-full overflow-x-auto">
        <figcaption className="mb-3 flex items-baseline justify-between gap-6 text-sm">
          <span className="font-semibold text-(--em-ink-50)">การ commit</span>
          <span aria-live="polite" className="font-mono text-xs text-(--em-sky-400)">
            {hot ?? ""}
          </span>
        </figcaption>
        <div className="flex gap-1">
          <div className="mr-1 grid grid-rows-7 gap-1" aria-hidden>
            {days.map((d, i) => (
              <span key={d} className="h-3 text-[9px] leading-3 text-(--em-ink-500)">
                {i % 2 ? d : ""}
              </span>
            ))}
          </div>
          {Array.from({ length: w }, (_, c) => (
            <div key={c} className="grid grid-rows-7 gap-1">
              {days.map((d, r) => {
                const level = Math.floor(rand(c * 7 + r + 1) ** 1.6 * 5);
                const label = `${d} สัปดาห์ ${String(c + 1)}: ${String(level * 3)} ครั้ง`;
                return (
                  <motion.button
                    key={d}
                    type="button"
                    aria-label={label}
                    onPointerEnter={() => {
                      setHot(label);
                    }}
                    onFocus={() => {
                      setHot(label);
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: c * 0.03 + r * 0.01 }}
                    whileHover={{ scale: 1.4 }}
                    className={`size-3 rounded-[3px] ${tones[level] ?? tones[0] ?? ""}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div
          className="mt-3 flex items-center justify-end gap-1 text-[10px] text-(--em-ink-500)"
          aria-hidden
        >
          น้อย
          {tones.map((t) => (
            <span key={t} className={`size-3 rounded-[3px] ${t}`} />
          ))}
          มาก
        </div>
      </figure>
    </div>
  );
}
