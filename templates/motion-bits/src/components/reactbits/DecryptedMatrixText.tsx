"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface DecryptedMatrixTextProps {
  text?: string;
  scrambleSpeed?: number;
  characters?: string;
  animateOn?: "mount" | "hover";
  revealedColor?: string;
  scrambleColor?: string;
  fontSize?: number;
  className?: string;
}

export default function DecryptedMatrixText({
  text = "Access granted",
  scrambleSpeed = 45,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*",
  animateOn = "mount",
  revealedColor = "#ffffff",
  scrambleColor = "#a855f7",
  fontSize = 40,
  className = "",
}: DecryptedMatrixTextProps) {
  const [revealed, setRevealed] = useState(animateOn === "hover" ? text.length : 0);
  const [tick, setTick] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    let step = 0;
    setRevealed(0);
    timer.current = setInterval(() => {
      step += 1;
      // three scramble frames per revealed character
      const next = Math.floor(step / 3);
      setRevealed(next);
      setTick((t) => t + 1);
      if (next >= text.length && timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    }, scrambleSpeed);
  }, [text, scrambleSpeed]);

  useEffect(() => {
    if (animateOn === "mount") run();
    else setRevealed(text.length);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [animateOn, run, text.length]);

  const pool = characters.length ? characters : "*";
  return (
    <span
      className={`inline-block font-mono font-semibold ${className}`}
      style={{ fontSize }}
      onMouseEnter={animateOn === "hover" ? run : undefined}
      aria-label={text}
    >
      {Array.from(text).map((ch, i) => {
        const done = i < revealed || ch === " ";
        return (
          <span key={i} aria-hidden style={{ color: done ? revealedColor : scrambleColor }}>
            {done ? ch : pool[(i * 31 + tick * 17 + ((i * tick) % 7)) % pool.length] /* deterministic so server and client markup match */}
          </span>
        );
      })}
    </span>
  );
}
