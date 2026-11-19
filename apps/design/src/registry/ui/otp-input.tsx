"use client";

import { motion } from "motion/react";
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

/** One box per digit: typing moves forward, Backspace moves back, pasting a whole code fills every box. */
export default function OtpInput({ length = 6 }: { length?: number }) {
  const n = Math.min(8, Math.max(4, Math.round(length)));
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length: n }, () => ""));
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const cells = Array.from({ length: n }, (_, i) => digits[i] ?? "");
  const done = cells.every((d) => d !== "");

  const set = (i: number, d: string) => {
    setDigits(cells.map((x, j) => (j === i ? d : x)));
  };
  const key = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !cells[i] && i > 0) boxes.current[i - 1]?.focus();
    if (e.key === "ArrowLeft") boxes.current[i - 1]?.focus();
    if (e.key === "ArrowRight") boxes.current[i + 1]?.focus();
  };
  const paste = (e: ClipboardEvent) => {
    const code = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, n);
    if (!code) return;
    e.preventDefault();
    setDigits(Array.from({ length: n }, (_, i) => code[i] ?? ""));
    boxes.current[Math.min(code.length, n - 1)]?.focus();
  };

  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <fieldset onPaste={paste} className="flex flex-wrap justify-center gap-2">
        <legend className="sr-only">รหัสยืนยัน {n} หลัก</legend>
        {cells.map((d, i) => (
          <motion.input
            key={i}
            ref={(el) => {
              boxes.current[i] = el;
            }}
            aria-label={`หลักที่ ${String(i + 1)}`}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={d}
            onKeyDown={(e) => {
              key(i, e);
            }}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(-1);
              set(i, v);
              if (v) boxes.current[i + 1]?.focus();
            }}
            animate={{ scale: d ? [1, 1.12, 1] : 1 }}
            transition={{ duration: 0.2 }}
            className={`size-12 rounded-lg border bg-(--em-ink-900) text-center font-mono text-xl font-bold text-(--em-ink-50) outline-none focus:border-(--em-sky-400) ${done ? "border-(--em-teal-400)" : "border-(--em-ink-700)"}`}
          />
        ))}
      </fieldset>
    </div>
  );
}
