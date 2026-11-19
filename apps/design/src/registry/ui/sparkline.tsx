"use client";

import { TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useId } from "react";

const rand = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** A stat card whose tiny line chart draws itself, with a soft area fill underneath. */
export default function Sparkline({ points = 16 }: { points?: number }) {
  const n = Math.min(30, Math.max(6, Math.round(points)));
  const id = useId();
  const ys = Array.from({ length: n }, (_, i) => 34 - (i / n) * 18 - rand(i + 3) * 12);
  const pts = ys.map((y, i) => `${(i / (n - 1)) * 100},${y.toFixed(1)}`);
  const line = `M${pts.join(" L")}`;
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div className="w-full max-w-xs rounded-xl border border-(--em-ink-800) bg-(--em-ink-900) p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-(--em-ink-300)">รายได้เดือนนี้</p>
          <span className="flex items-center gap-1 rounded-full bg-(--em-teal-600)/20 px-2 py-0.5 text-xs text-(--em-teal-400)">
            <TrendingUp aria-hidden className="size-3" />
            +18%
          </span>
        </div>
        <p className="mt-1 font-heading text-3xl font-black text-(--em-ink-50) tabular-nums">
          ฿48,200
        </p>
        <svg
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          className="mt-4 h-16 w-full"
          aria-hidden
        >
          <defs>
            <linearGradient id={`${id}-a`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--em-sky-400)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--em-sky-400)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={`${line} L100,40 L0,40 Z`}
            fill={`url(#${id}-a)`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          />
          <motion.path
            d={line}
            fill="none"
            stroke="var(--em-sky-400)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        </svg>
      </div>
    </div>
  );
}
