"use client";

import { ArrowRight } from "lucide-react";

const tones = {
  blue: "var(--em-blue-400)",
  sky: "var(--em-sky-400)",
  violet: "var(--em-violet-500)",
  teal: "var(--em-teal-400)",
} as const;

/** A beam of light runs round a 1px border: a big conic square spins behind the face (transform only). */
export function BeamButton({
  label = "เริ่มสร้างเลย",
  duration = 3,
  tone = "sky",
}: {
  label?: string;
  duration?: number;
  tone?: keyof typeof tones;
}) {
  const color = tones[tone];
  return (
    <div className="flex size-full min-h-40 items-center justify-center bg-(--em-ink-975) p-6">
      <button
        type="button"
        className="group relative overflow-hidden rounded-lg p-px outline-offset-4 focus-visible:outline-2 focus-visible:outline-(--em-blue-400)"
      >
        <span aria-hidden className="absolute inset-0 bg-(--em-ink-800)" />
        <span
          aria-hidden
          className="vt-live absolute top-1/2 left-1/2 aspect-square -translate-1/2 w-[max(300%,16rem)] animate-[beam-spin_linear_infinite] motion-reduce:animate-none"
          style={{
            background: `conic-gradient(from 0deg, transparent 0 70%, ${color} 85%, transparent 100%)`,
            animationDuration: `${duration}s`,
          }}
        />
        <span className="relative flex items-center gap-2 rounded-[0.45rem] bg-(--em-ink-950) px-6 py-3 font-semibold text-(--em-ink-50) transition-transform group-active:scale-[0.97]">
          {label}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </button>
    </div>
  );
}
