"use client";

import { motion } from "motion/react";

/**
 * A progress bar filled with water. The whole fill slides in with translateX (no width animation) and
 * its leading edge is a wavy strip that keeps lapping up and down.
 */
export default function TideProgress({ value = 64 }: { value?: number }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <style>{`@keyframes tide-progress-lap{to{transform:translateY(-50%)}}.tide-progress-wave{animation:tide-progress-lap 1.8s linear infinite}@media (prefers-reduced-motion:reduce){.tide-progress-wave{animation:none}}`}</style>
      <div className="w-full max-w-sm">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-(--em-ink-200)">กำลังอัปโหลด</span>
          <span className="font-mono text-(--em-sky-400)">{Math.round(v)}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={Math.round(v)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="ความคืบหน้า"
          className="relative h-6 overflow-hidden rounded-md border border-(--em-ink-700) bg-(--em-ink-900)"
        >
          <motion.div
            className="absolute inset-0"
            initial={{ x: "-100%" }}
            animate={{ x: `${String(v - 100)}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 16 }}
          >
            <div className="absolute inset-0 bg-linear-to-r from-(--em-blue-700) to-(--em-sky-500)" />
            <div aria-hidden className="absolute inset-y-0 -right-2 w-2 overflow-hidden">
              <svg
                viewBox="0 0 8 48"
                preserveAspectRatio="none"
                className="tide-progress-wave vt-live h-[200%] w-full"
              >
                <path d="M0 0 Q8 6 0 12 T0 24 T0 36 T0 48 Z" fill="var(--em-sky-500)" />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
