"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * A figure counts up from zero the first time it comes into view and eases into its final value.
 * The final value is in the HTML from the start, so it reads right without JavaScript.
 */
export default function RollCount({
  to = 12480,
  duration = 2,
  label = "ชิ้นงานที่ส่งแล้ว",
  separator = true,
}: {
  to?: number;
  duration?: number;
  label?: string;
  separator?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.6 });
  const still = useReducedMotion();
  const [run, setRun] = useState(0);
  const fmt = (v: number) => Math.round(v).toLocaleString("th-TH", { useGrouping: separator });

  useEffect(() => {
    const el = ref.current;
    if (!el || !seen || still) return;
    const c = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (el.textContent = fmt(v)),
    });
    return () => {
      c.stop();
      el.textContent = fmt(to);
    };
  }, [seen, still, to, duration, separator, run]); // eslint-disable-line react-hooks/exhaustive-deps -- fmt follows separator

  return (
    <div className="grid size-full min-h-56 place-items-center gap-3 bg-(--em-ink-975) p-6 text-center">
      <p>
        <span
          ref={ref}
          className="block font-heading text-6xl font-black text-(--em-ink-50) tabular-nums sm:text-8xl"
        >
          {fmt(to)}
        </span>
        <span className="mt-2 block text-sm text-(--em-ink-400)">{label}</span>
      </p>
      <button
        type="button"
        onClick={() => {
          setRun((r) => r + 1);
        }}
        className="rounded-md border border-(--em-ink-700) px-3 py-1.5 text-sm text-(--em-ink-300) transition-colors hover:text-(--em-ink-50)"
      >
        นับใหม่
      </button>
    </div>
  );
}
