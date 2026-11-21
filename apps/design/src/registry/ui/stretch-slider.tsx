"use client";

import { Volume1, Volume2 } from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useRef, useState } from "react";

/** A volume slider that stretches like rubber when you pull past either end, then snaps back. */
export default function StretchSlider({ value = 40 }: { value?: number }) {
  const [v, setV] = useState(value);
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setV(value);
  }
  const track = useRef<HTMLDivElement>(null);
  const over = useMotionValue(0);
  const scaleX = useTransform(over, (o) => 1 + Math.min(0.15, Math.abs(o) / 600));
  const originX = useTransform(over, (o) => (o < 0 ? 1 : 0));
  const lo = useTransform(over, (o) => (o < 0 ? 1.25 : 1));
  const hi = useTransform(over, (o) => (o > 0 ? 1.25 : 1));
  const pull = (clientX: number) => {
    const r = track.current?.getBoundingClientRect();
    if (!r) return;
    const raw = ((clientX - r.left) / r.width) * 100;
    setV(Math.round(Math.max(0, Math.min(100, raw))));
    over.set(raw < 0 ? raw * (r.width / 100) : raw > 100 ? (raw - 100) * (r.width / 100) : 0);
  };
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div className="flex w-full max-w-xs items-center gap-3">
        <motion.span style={{ scale: lo }} aria-hidden>
          <Volume1 className="size-5 text-(--em-ink-300)" />
        </motion.span>
        <motion.div
          ref={track}
          role="slider"
          tabIndex={0}
          aria-label="ระดับเสียง"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={v}
          style={{ scaleX, originX }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            pull(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) pull(e.clientX);
          }}
          onPointerUp={() => {
            animate(over, 0, { type: "spring", stiffness: 500, damping: 15 });
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") setV(Math.min(100, v + 5));
            else if (e.key === "ArrowLeft") setV(Math.max(0, v - 5));
          }}
          className="relative h-3 flex-1 cursor-pointer touch-none rounded-full bg-(--em-ink-800) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--em-sky-400)"
        >
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-(--em-sky-400)"
            style={{ width: `${String(v)}%` }}
          />
        </motion.div>
        <motion.span style={{ scale: hi }} aria-hidden>
          <Volume2 className="size-5 text-(--em-ink-300)" />
        </motion.span>
        <span className="w-8 text-right font-mono text-xs text-(--em-ink-400) tabular-nums">
          {v}
        </span>
      </div>
    </div>
  );
}
