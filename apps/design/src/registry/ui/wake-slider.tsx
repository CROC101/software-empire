"use client";

import { motion } from "motion/react";
import { useRef, useState } from "react";

type Ring = { id: number; at: number };

/** A slider that leaves rings in its wake as the thumb moves, like a boat across still water. */
export default function WakeSlider({ value = 50 }: { value?: number }) {
  const [v, setV] = useState(value);
  const [seen, setSeen] = useState(value);
  const [rings, setRings] = useState<Ring[]>([]);
  const last = useRef(0);
  const n = useRef(0);
  if (seen !== value) {
    setSeen(value);
    setV(value);
  }
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div className="w-full max-w-xs">
        <div className="relative h-10">
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-(--em-ink-800)">
            <div
              className="h-full origin-left bg-(--em-blue-600)"
              style={{ transform: `scaleX(${String(v / 100)})` }}
            />
          </div>
          {rings.map((r) => (
            <motion.span
              key={r.id}
              aria-hidden
              className="absolute top-1/2 -mt-3 -ml-3 size-6 rounded-full border border-(--em-sky-400)"
              style={{ left: `${String(r.at)}%` }}
              initial={{ scale: 0.4, opacity: 0.8 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              onAnimationComplete={() => {
                setRings((all) => all.filter((o) => o.id !== r.id));
              }}
            />
          ))}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ transform: `translateX(${String(v)}%)` }}
          >
            <span className="absolute top-1/2 -mt-2.5 -ml-2.5 size-5 rounded-full bg-(--em-ink-0)" />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={v}
            aria-label="ระดับ"
            onChange={(e) => {
              const next = Number(e.target.value);
              setV(next);
              const now = performance.now();
              if (now - last.current > 80) {
                last.current = now;
                setRings((all) => [...all.slice(-7), { id: n.current++, at: next }]);
              }
            }}
            className="peer absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </div>
        <p className="mt-2 text-right font-mono text-xs text-(--em-ink-400) tabular-nums">{v}</p>
      </div>
    </div>
  );
}
