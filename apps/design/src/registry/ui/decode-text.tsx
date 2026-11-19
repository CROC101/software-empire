"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { useCallback, useEffect, useRef, useState } from "react";

const charsets = {
  letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  symbols: "!<>-_\\/[]{}=+*^?#$%&@",
  binary: "01",
} as const;

/** Scrambles, then decodes left to right. The real text renders first (SSR, screen readers). */
export function DecodeText({
  text = "CROCWORK DESIGN",
  duration = 1200,
  trigger = "loop",
  charset = "letters",
}: {
  text?: string;
  duration?: number;
  trigger?: "mount" | "hover" | "loop";
  charset?: keyof typeof charsets;
}) {
  const [shown, setShown] = useState<string | null>(null);
  const frame = useRef(0);
  const still = useReducedMotionAfterMount();

  const run = useCallback(() => {
    if (still) return;
    cancelAnimationFrame(frame.current);
    const pool = charsets[charset];
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const revealed = Math.floor(progress * text.length);
      setShown(
        Array.from(text, (c, i) =>
          c === " " || i < revealed ? c : pool[Math.floor(Math.random() * pool.length)],
        ).join(""),
      );
      if (progress < 1) frame.current = requestAnimationFrame(tick);
      else setShown(null);
    };
    frame.current = requestAnimationFrame(tick);
  }, [text, duration, charset, still]);

  useEffect(() => {
    if (trigger === "mount") run();
    const loop = trigger === "loop" ? setInterval(run, duration + 1600) : undefined;
    if (loop) run();
    return () => {
      clearInterval(loop);
      cancelAnimationFrame(frame.current);
    };
  }, [run, trigger, text, duration]);

  // mono only for Latin: Thai is never set in mono
  const latin = /^[\x20-\x7e]*$/.test(text);
  return (
    <div className="flex size-full min-h-40 items-center justify-center bg-(--em-ink-975) p-6">
      <span
        aria-label={text}
        onPointerEnter={trigger === "hover" ? run : undefined}
        className={`text-center text-3xl font-bold text-(--em-sky-400) sm:text-4xl ${latin ? "font-mono" : "font-heading"}`}
      >
        <span aria-hidden>{shown ?? text}</span>
      </span>
    </div>
  );
}

export default DecodeText;
