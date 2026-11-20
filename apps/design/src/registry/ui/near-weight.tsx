"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { useEffect, useRef } from "react";

const graphemes = (s: string) =>
  [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(s)].map((g) => g.segment);

/**
 * Letters near the pointer grow heavier and brighter on the font's weight axis, fading back with
 * distance. "falloff" picks how sharply the effect drops off.
 */
export default function NearWeight({
  text = "ตัวหนังสือรู้ว่าคุณอยู่ใกล้",
  radius = 140,
  falloff = "smooth",
}: {
  text?: string;
  radius?: number;
  falloff?: "linear" | "smooth" | "sharp";
}) {
  const box = useRef<HTMLDivElement>(null);
  const still = useReducedMotionAfterMount();

  useEffect(() => {
    const el = box.current;
    if (!el || still) return;
    const letters = [...el.querySelectorAll<HTMLElement>("[data-l]")];
    const curve = (k: number) =>
      falloff === "linear" ? k : falloff === "smooth" ? k * k * (3 - 2 * k) : k ** 3;
    let x = -1e4;
    let y = -1e4;
    let raf = 0;
    const draw = () => {
      raf = 0;
      for (const l of letters) {
        const r = l.getBoundingClientRect();
        const k = curve(
          Math.max(0, 1 - Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y) / radius),
        );
        l.style.fontVariationSettings = `"wght" ${String(Math.round(300 + 600 * k))}`;
        l.style.opacity = String(0.55 + 0.45 * k);
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
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [radius, falloff, still, text]);

  return (
    <div ref={box} className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <p
        aria-label={text}
        className="max-w-2xl text-center font-heading text-4xl leading-snug text-(--em-ink-50) sm:text-6xl"
      >
        {graphemes(text).map((c, i) => (
          <span
            key={i}
            data-l
            aria-hidden
            className="whitespace-pre-wrap"
            style={{ fontVariationSettings: '"wght" 300', opacity: 0.55 }}
          >
            {c}
          </span>
        ))}
      </p>
    </div>
  );
}
