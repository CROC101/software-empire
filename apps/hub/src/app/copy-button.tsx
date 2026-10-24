"use client";

import { useState } from "react";

/** "คัดลอก" → "คัดลอกแล้ว" for 1.6 s; the label change is announced to screen readers. */
export function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        });
      }}
      className={`border border-current px-3 py-1.5 text-sm font-bold transition-transform active:scale-95 ${className}`}
    >
      <span aria-live="polite">{done ? "คัดลอกแล้ว ✓" : "คัดลอก"}</span>
    </button>
  );
}
