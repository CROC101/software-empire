"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { useEffect, useState } from "react";

const graphemes = (s: string) =>
  [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(s)].map((g) => g.segment);

/**
 * A terminal prints the line: a block cursor walks right and lights each letter, a hex address
 * counts along under it, then the line holds and prints again. Full text renders first (SSR).
 */
export default function CircuitText({
  text = "SYSTEM ONLINE",
  speed = 90,
}: {
  text?: string;
  speed?: number;
}) {
  const chars = graphemes(text);
  const still = useReducedMotionAfterMount();
  const [tick, setTick] = useState(-1);

  useEffect(() => {
    if (still) return;
    const id = setInterval(() => {
      setTick((t) => t + 1);
    }, speed);
    return () => {
      clearInterval(id);
    };
  }, [speed, still]);

  const cycle = chars.length + 16;
  const shown = tick < 0 ? chars.length : Math.min(tick % cycle, chars.length);
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div className="grid gap-3">
        <p
          aria-label={text}
          className="font-heading text-4xl font-black text-(--em-ink-50) sm:text-6xl"
        >
          {chars.map((c, i) => (
            <span
              key={i}
              aria-hidden
              className={
                i === shown
                  ? "bg-(--em-blue-500) whitespace-pre text-(--em-ink-975)"
                  : i < shown
                    ? "whitespace-pre"
                    : "whitespace-pre opacity-0"
              }
            >
              {c}
            </span>
          ))}
        </p>
        <p aria-hidden className="font-mono text-xs text-(--em-ink-500) tabular-nums">
          0x{(shown * 16).toString(16).padStart(4, "0")} · {shown}/{chars.length}
        </p>
      </div>
    </div>
  );
}
