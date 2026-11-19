"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { animate, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

// demo numbers: shown as examples, never as real figures
const tiles = [
  {
    label: "ผู้เข้าชม",
    value: 12840,
    suffix: "",
    span: "sm:col-span-2",
    line: [3, 5, 4, 7, 6, 9, 8, 11],
  },
  { label: "อัตราแปลง", value: 4.6, suffix: "%", span: "", line: [2, 3, 3, 4, 3, 5, 4, 5] },
  { label: "งานเสร็จ", value: 128, suffix: "", span: "", line: [1, 2, 4, 3, 5, 6, 6, 8] },
  {
    label: "เวลาตอบกลับ",
    value: 1.8,
    suffix: " ชม.",
    span: "sm:col-span-2",
    line: [8, 7, 7, 5, 6, 4, 3, 3],
  },
];

const tones = {
  blue: "var(--em-blue-400)",
  sky: "var(--em-sky-400)",
  violet: "var(--em-violet-500)",
  teal: "var(--em-teal-400)",
} as const;

function Count({
  to,
  suffix,
  run,
  duration,
}: {
  to: number;
  suffix: string;
  run: boolean;
  duration: number;
}) {
  const [n, setN] = useState(0);
  const still = useReducedMotionAfterMount();
  useEffect(() => {
    if (!run || still) return;
    const c = animate(0, to, { duration, ease: "easeOut", onUpdate: setN });
    return () => {
      c.stop();
    };
  }, [run, to, duration, still]);
  const value = still ? to : n;
  const digits = Number.isInteger(to) ? 0 : 1;
  return (
    <span className="tabular-nums">
      {value.toLocaleString("th-TH", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })}
      {suffix}
    </span>
  );
}

function Spark({
  points,
  color,
  run,
  duration,
}: {
  points: number[];
  color: string;
  run: boolean;
  duration: number;
}) {
  const max = Math.max(...points);
  const d = points
    .map((p, i) => `${i ? "L" : "M"}${(i / (points.length - 1)) * 100},${30 - (p / max) * 26}`)
    .join(" ");
  return (
    <span className="relative mt-3 block h-8 overflow-hidden">
      <svg aria-hidden viewBox="0 0 100 32" preserveAspectRatio="none" className="size-full">
        <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* the cover slides away to reveal the line: transform only */}
      <motion.span
        aria-hidden
        className="absolute inset-0 origin-right bg-(--em-ink-950)"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: run ? 0 : 1 }}
        transition={{ duration, ease: "easeOut" }}
      />
    </span>
  );
}

/** Bento tiles: numbers count up and sparklines reveal when the grid scrolls into view. */
export function MetricBento({
  duration = 1.4,
  lift = true,
  tone = "blue",
}: {
  duration?: number;
  lift?: boolean;
  tone?: keyof typeof tones;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const run = useInView(ref, { once: true, amount: 0.3 });
  const color = tones[tone];
  return (
    <div className="flex size-full min-h-72 items-center justify-center bg-(--em-ink-975) p-5">
      <div ref={ref} className="grid w-full max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <motion.div
            key={t.label}
            whileHover={lift ? { y: -4 } : undefined}
            className={`col-span-2 rounded-xl border border-(--em-ink-800) bg-(--em-ink-950) p-4 ${t.span}`}
          >
            <p className="text-xs text-(--em-ink-400)">{t.label}</p>
            <p className="mt-1 text-2xl font-black text-(--em-ink-50)">
              <Count to={t.value} suffix={t.suffix} run={run} duration={duration} />
            </p>
            <Spark points={t.line} color={color} run={run} duration={duration} />
          </motion.div>
        ))}
        <p className="col-span-2 text-[10px] text-(--em-ink-500) sm:col-span-4">ตัวเลขตัวอย่าง</p>
      </div>
    </div>
  );
}

export default MetricBento;
