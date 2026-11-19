"use client";

import { motion } from "motion/react";
import { useId } from "react";

/** A ring that sweeps to the value with a water gradient; the number sits in the middle. */
export default function RingGauge({ value = 72 }: { value?: number }) {
  const v = Math.min(100, Math.max(0, value));
  const id = useId();
  return (
    <div className="grid size-full min-h-64 place-items-center bg-(--em-ink-975) p-6">
      <div
        role="meter"
        aria-valuenow={Math.round(v)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="คะแนนประสิทธิภาพ"
        className="relative grid size-44 place-items-center"
      >
        <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90" aria-hidden>
          <defs>
            <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--em-sky-400)" />
              <stop offset="100%" stopColor="var(--em-blue-600)" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--em-ink-800)" strokeWidth="10" />
          <motion.circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={`url(#${id}-g)`}
            strokeWidth="10"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: v / 100 }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
          />
        </svg>
        <div className="text-center">
          <p className="font-heading text-5xl font-black text-(--em-ink-50) tabular-nums">
            {Math.round(v)}
          </p>
          <p className="text-xs text-(--em-ink-400)">จาก 100</p>
        </div>
      </div>
    </div>
  );
}
