"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { useEffect, useState } from "react";

const graphemes = (s: string) =>
  [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(s)].map((g) => g.segment);

/** Types a word one grapheme at a time, holds, deletes, then moves to the next word. Thai vowels stay on their consonant. */
export default function Typewriter({
  words = "ออกแบบ,สร้าง,ส่งงาน",
  speed = 90,
}: {
  words?: string;
  speed?: number;
}) {
  const list = words
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);
  const still = useReducedMotionAfterMount();
  const [state, setState] = useState({ word: 0, shown: 0, deleting: false });
  const current = graphemes(list[state.word % Math.max(1, list.length)] ?? "");

  useEffect(() => {
    if (still || list.length === 0) return;
    const full = state.shown >= current.length;
    const wait = state.deleting ? speed / 2 : full ? 1400 : speed;
    const t = setTimeout(() => {
      setState((s) => {
        if (!s.deleting && s.shown >= current.length) return { ...s, deleting: true };
        if (s.deleting && s.shown <= 0) return { word: s.word + 1, shown: 0, deleting: false };
        return { ...s, shown: s.shown + (s.deleting ? -1 : 1) };
      });
    }, wait);
    return () => {
      clearTimeout(t);
    };
  }, [state, current.length, list.length, speed, still]);

  const text = still ? current.join("") : current.slice(0, state.shown).join("");
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6 text-(--em-ink-100)">
      <p className="font-heading text-3xl font-black sm:text-5xl">
        เราช่วยคุณ <span className="text-(--em-sky-400)">{text}</span>
        <span
          aria-hidden
          className="ml-1 inline-block h-[0.9em] w-[3px] translate-y-[0.12em] animate-pulse bg-(--em-sky-400) motion-reduce:animate-none"
        />
        <span className="sr-only">{list.join(", ")}</span>
      </p>
    </div>
  );
}
