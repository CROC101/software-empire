"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const states = ["load", "ok", "error"] as const;
const words = { load: "กำลังส่ง", ok: "ส่งสำเร็จ", error: "ส่งไม่สำเร็จ" };

/** One mark that turns from a spinner into a tick or a cross, drawing the new stroke in. */
export default function StatusMark({ auto = true }: { auto?: boolean }) {
  const [i, setI] = useState(0);
  const s = states[i % states.length] ?? "load";
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      setI((v) => v + 1);
    }, 1600);
    return () => {
      clearInterval(t);
    };
  }, [auto]);
  const tone =
    s === "ok" ? "var(--em-success)" : s === "error" ? "var(--em-danger)" : "var(--em-sky-400)";
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <button
        type="button"
        onClick={() => {
          setI((v) => v + 1);
        }}
        className="flex flex-col items-center gap-3 rounded-lg p-3 focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
      >
        <svg aria-hidden viewBox="0 0 48 48" className="size-16">
          <circle cx="24" cy="24" r="20" fill="none" stroke="var(--em-ink-800)" strokeWidth="3" />
          <AnimatePresence mode="wait">
            {s === "load" ? (
              <motion.circle
                key="load"
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={tone}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="30 200"
                className="vt-live"
                style={{ originX: "50%", originY: "50%" }}
                animate={{ rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <motion.path
                key={s}
                d={s === "ok" ? "M15 24.5l6 6L33 18" : "M17 17l14 14M31 17L17 31"}
                fill="none"
                stroke={tone}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              />
            )}
          </AnimatePresence>
        </svg>
        <span className="text-sm text-(--em-ink-300)" aria-live="polite">
          {words[s]}
        </span>
      </button>
    </div>
  );
}
