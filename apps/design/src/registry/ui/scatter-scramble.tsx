"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { useEffect, useRef } from "react";

const glyphs = "!<>-_/[]{}=+*^?#%&@01";

const graphemes = (s: string) =>
  [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(s)].map((g) => g.segment);

/**
 * Letters near the pointer break into random symbols and settle back once it moves on, like a
 * magnet over a ticker board. The real text stays in the accessible name.
 */
export default function ScatterScramble({
  text = "Move your pointer over this line and watch the letters near it scramble, then settle back.",
  radius = 90,
  hold = 500,
}: {
  text?: string;
  radius?: number;
  hold?: number;
}) {
  const box = useRef<HTMLParagraphElement>(null);
  const still = useReducedMotionAfterMount();

  useEffect(() => {
    const el = box.current;
    if (!el || still) return;
    const spans = [...el.querySelectorAll<HTMLElement>("[data-c]")];
    const until = new Float64Array(spans.length);
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      let busy = false;
      for (const [i, s] of spans.entries()) {
        const end = until[i] ?? 0;
        if (!end) continue;
        if (now > end) {
          until[i] = 0;
          s.textContent = s.dataset.c ?? "";
          s.classList.remove("text-(--em-blue-400)");
        } else {
          busy = true;
          s.textContent = glyphs[Math.floor(Math.random() * glyphs.length)] ?? "#";
        }
      }
      raf = busy ? requestAnimationFrame(tick) : 0;
    };
    const move = (e: PointerEvent) => {
      const now = performance.now();
      spans.forEach((s, i) => {
        if (s.dataset.c === " ") return;
        const r = s.getBoundingClientRect();
        if (
          Math.hypot(r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY) < radius
        ) {
          until[i] = now + hold;
          s.classList.add("text-(--em-blue-400)");
        }
      });
      raf ||= requestAnimationFrame(tick);
    };
    el.addEventListener("pointermove", move);
    return () => {
      el.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
      spans.forEach((s) => (s.textContent = s.dataset.c ?? ""));
    };
  }, [radius, hold, still, text]);

  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <p
        key={text} // effect rewrites span text; remount on new text so React never patches stale nodes
        ref={box}
        aria-label={text}
        className="max-w-2xl font-mono text-xl leading-relaxed text-(--em-ink-100) sm:text-2xl"
      >
        {graphemes(text).map((c, i) => (
          <span key={i} data-c={c} aria-hidden className="whitespace-pre-wrap">
            {c}
          </span>
        ))}
      </p>
    </div>
  );
}
