"use client";

import { motion } from "motion/react";
import { useState } from "react";

type State = "idle" | "burn" | "sent";

/** A send button with a fuse round its edge: it burns down before sending, and a second press puts it out. */
export default function FuseButton({ seconds = 2 }: { seconds?: number }) {
  const [state, setState] = useState<State>("idle");
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setState(state === "idle" ? "burn" : "idle");
          }}
          className="relative h-12 w-44 rounded-lg bg-(--em-ink-800) text-sm font-semibold text-(--em-ink-0) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--em-sky-400)"
        >
          <svg aria-hidden className="absolute inset-0 size-full overflow-visible">
            {state === "burn" && (
              <motion.rect
                x="1"
                y="1"
                width="174"
                height="46"
                rx="8"
                fill="none"
                stroke="var(--em-sky-400)"
                strokeWidth="2"
                initial={{ pathLength: 1 }}
                animate={{ pathLength: 0 }}
                transition={{ duration: seconds, ease: "linear" }}
                onAnimationComplete={() => {
                  setState("sent");
                }}
              />
            )}
          </svg>
          {state === "idle"
            ? "ส่งใบเสนอราคา"
            : state === "burn"
              ? "กดอีกครั้งเพื่อยกเลิก"
              : "ส่งแล้ว"}
        </button>
        <span className="text-xs text-(--em-ink-500)" aria-live="polite">
          {state === "sent" ? "ส่งให้ลูกค้าแล้ว" : ""}
        </span>
      </div>
    </div>
  );
}
