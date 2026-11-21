"use client";

import { Phone, PhoneOff } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

type State = "idle" | "ring" | "talk";

/** A dark chip at the top that grows into an incoming call, shrinks to a timer when you answer. */
export default function CallChip({ name = "ลูกค้า ร้านกาแฟ" }: { name?: string }) {
  const [state, setState] = useState<State>("idle");
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (state !== "talk") return;
    const t = setInterval(() => {
      setSec((s) => s + 1);
    }, 1000);
    return () => {
      clearInterval(t);
    };
  }, [state]);
  const time = `${String(Math.floor(sec / 60))}:${String(sec % 60).padStart(2, "0")}`;
  const spring = { type: "spring", stiffness: 420, damping: 32 } as const;
  return (
    <div className="flex size-full min-h-64 flex-col items-center gap-6 bg-(--em-ink-200) p-6">
      <motion.div
        layout
        transition={spring}
        role="status"
        className="flex items-center gap-3 overflow-hidden rounded-3xl bg-(--em-ink-975) text-(--em-ink-0)"
        style={{ padding: state === "ring" ? 12 : 8 }}
      >
        {state === "idle" && <motion.span layout className="block h-3 w-20" />}
        {state === "talk" && (
          <>
            <motion.span layout className="size-2 rounded-full bg-(--em-success)" />
            <motion.span layout className="font-mono text-xs tabular-nums">
              {time}
            </motion.span>
            <button
              type="button"
              aria-label="วางสาย"
              onClick={() => {
                setState("idle");
              }}
              className="grid size-6 place-items-center rounded-full bg-(--em-danger) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
            >
              <PhoneOff className="size-3" />
            </button>
          </>
        )}
        {state === "ring" && (
          <>
            <motion.span
              layout
              className="grid size-10 place-items-center rounded-full bg-(--em-blue-600) font-semibold"
            >
              {name.slice(0, 1)}
            </motion.span>
            <motion.span layout className="flex flex-col pr-2">
              <span className="text-xs text-(--em-ink-400)">สายเข้า</span>
              <span className="text-sm font-semibold">{name}</span>
            </motion.span>
            <button
              type="button"
              aria-label="ไม่รับสาย"
              onClick={() => {
                setState("idle");
              }}
              className="grid size-9 place-items-center rounded-full bg-(--em-danger) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
            >
              <PhoneOff className="size-4" />
            </button>
            <button
              type="button"
              aria-label="รับสาย"
              onClick={() => {
                setSec(0);
                setState("talk");
              }}
              className="grid size-9 place-items-center rounded-full bg-(--em-success) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
            >
              <Phone className="size-4" />
            </button>
          </>
        )}
      </motion.div>
      {state === "idle" && (
        <button
          type="button"
          onClick={() => {
            setState("ring");
          }}
          className="mt-auto rounded-md bg-(--em-ink-900) px-4 py-2 text-sm text-(--em-ink-100) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
        >
          จำลองสายเข้า
        </button>
      )}
    </div>
  );
}
