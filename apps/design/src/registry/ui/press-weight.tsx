"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { useEffect, useRef } from "react";

const graphemes = (s: string) =>
  [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(s)].map((g) => g.segment);

/**
 * Press on the word: letters under the pointer swell to the heaviest weight and stand taller, the
 * rest thin out. Uses the variable heading font's weight axis; the pointer is read once a frame.
 */
export default function PressWeight({
  text = "PRESSURE",
  thin = 200,
  radius = 220,
}: {
  text?: string;
  thin?: number;
  radius?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const still = useReducedMotionAfterMount();

  useEffect(() => {
    const el = box.current;
    if (!el || still) return;
    const letters = [...el.querySelectorAll<HTMLElement>("[data-l]")];
    let x = -1e4;
    let y = -1e4;
    let raf = 0;
    const draw = () => {
      raf = 0;
      for (const l of letters) {
        const r = l.getBoundingClientRect();
        const d = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y);
        const k = Math.max(0, 1 - d / radius);
        l.style.fontVariationSettings = `"wght" ${String(Math.round(thin + (900 - thin) * k))}`;
        l.style.transform = `scaleY(${String(1 + 0.35 * k)})`;
      }
    };
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      raf ||= requestAnimationFrame(draw);
    };
    const leave = () => {
      x = y = -1e4;
      raf ||= requestAnimationFrame(draw);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    draw();
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [thin, radius, still, text]);

  return (
    <div
      ref={box}
      className="grid size-full min-h-56 touch-none place-items-center bg-(--em-ink-975) p-6"
    >
      <p
        aria-label={text}
        className="flex w-full justify-between font-heading text-5xl text-(--em-ink-50) sm:text-8xl"
      >
        {graphemes(text).map((c, i) => (
          <span
            key={i}
            data-l
            aria-hidden
            className="inline-block origin-bottom whitespace-pre"
            style={{ fontVariationSettings: `"wght" ${String(thin)}` }}
          >
            {c}
          </span>
        ))}
      </p>
    </div>
  );
}
