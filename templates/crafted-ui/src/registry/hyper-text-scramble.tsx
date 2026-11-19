"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface HyperTextScrambleProps {
  text?: string;
  duration?: number;
  trigger?: "mount" | "hover";
  charset?: "alphanumeric" | "binary" | "symbols";
  color?: string;
  fontSize?: number;
}

const CHARSETS = {
  alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  binary: "01",
  symbols: "!<>-_\\/[]{}=+*^?#$%&",
} as const;

export function HyperTextScramble({
  text = "DESIGN ENGINEERING",
  duration = 1200,
  trigger = "mount",
  charset = "alphanumeric",
  color = "#22d3ee",
  fontSize = 40,
}: HyperTextScrambleProps) {
  const [display, setDisplay] = useState(text);
  const frame = useRef<number | null>(null);

  const run = useCallback(() => {
    if (frame.current) cancelAnimationFrame(frame.current);
    const chars = CHARSETS[charset];
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const revealed = Math.floor(progress * text.length);
      setDisplay(
        text
          .split("")
          .map((c, i) => (c === " " || i < revealed ? c : chars[Math.floor(Math.random() * chars.length)]))
          .join(""),
      );
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [text, duration, charset]);

  useEffect(() => {
    if (trigger === "mount") run();
    else setDisplay(text);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [run, trigger, text]);

  return (
    <div className="flex w-full items-center justify-center p-6">
      <span
        onPointerEnter={trigger === "hover" ? run : undefined}
        aria-label={text}
        className="cursor-default font-mono font-bold tracking-tight [text-shadow:0_0_24px_currentColor]"
        style={{ color, fontSize }}
      >
        {display}
      </span>
    </div>
  );
}

export default HyperTextScramble;
