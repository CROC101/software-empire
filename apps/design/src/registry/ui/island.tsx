"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { Music2, Phone, PhoneOff, Timer } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const states = ["idle", "call", "music", "timer"] as const;
type State = (typeof states)[number];

const next = (s: State): State => states[(states.indexOf(s) + 1) % states.length] ?? "idle";

const names: Record<State, string> = {
  idle: "ว่าง",
  call: "สายเข้า",
  music: "กำลังเล่นเพลง",
  timer: "ตัวจับเวลา",
};

function Content({ state }: { state: State }) {
  if (state === "call")
    return (
      <div className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-(--em-ink-800) text-xs font-bold text-(--em-ink-100)">
          ก
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] text-(--em-ink-400)">สายเข้า</span>
          <span className="block truncate text-sm font-semibold text-(--em-ink-50)">
            ก้อง ทีมดีไซน์
          </span>
        </span>
        <span className="flex size-8 items-center justify-center rounded-full bg-(--em-coral-500) text-(--em-ink-0)">
          <PhoneOff aria-hidden className="size-4" />
        </span>
        <span className="flex size-8 items-center justify-center rounded-full bg-(--em-teal-600) text-(--em-ink-0)">
          <Phone aria-hidden className="size-4" />
        </span>
      </div>
    );
  if (state === "music")
    return (
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-md bg-linear-to-br from-(--em-sky-500) to-(--em-blue-700) text-(--em-ink-0)">
          <Music2 aria-hidden className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-(--em-ink-50)">
            น้ำขึ้นตอนเที่ยงคืน
          </span>
          <span className="block text-[10px] text-(--em-ink-400)">ตัวอย่างเพลง</span>
        </span>
        <span aria-hidden className="flex h-4 items-end gap-0.5">
          {[0.6, 1, 0.4, 0.8].map((h, i) => (
            <motion.span
              key={i}
              className="vt-live w-0.5 origin-bottom rounded-full bg-(--em-sky-400)"
              style={{ height: "100%" }}
              animate={{ scaleY: [h, 0.25, 1, h] }}
              transition={{ duration: 1 + i * 0.15, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </span>
      </div>
    );
  if (state === "timer")
    return (
      <div className="flex items-center gap-2">
        <Timer aria-hidden className="size-4 text-(--em-gold-300)" />
        <span className="font-mono text-sm text-(--em-gold-300) tabular-nums">04:59</span>
      </div>
    );
  return <span className="block h-1 w-10 rounded-full bg-(--em-ink-700)" />;
}

/** A status island that morphs between states with layout animation (transform based). */
export function Island({
  state = "music",
  autoplay = true,
}: {
  state?: State;
  autoplay?: boolean;
}) {
  const [current, setCurrent] = useState<State>(state);
  const [prop, setProp] = useState(state);
  const still = useReducedMotionAfterMount();
  // the playground's select wins over the island's own cycling
  if (prop !== state) {
    setProp(state);
    setCurrent(state);
  }
  useEffect(() => {
    if (!autoplay || still) return;
    const id = setInterval(() => setCurrent(next), 3200);
    return () => clearInterval(id);
  }, [autoplay, still]);

  const wide = current === "call" || current === "music";
  return (
    <div className="flex size-full min-h-48 items-start justify-center bg-(--em-ink-975) p-8">
      <motion.button
        type="button"
        layout
        aria-label={`สถานะ: ${names[current]} แตะเพื่อเปลี่ยน`}
        onClick={() => setCurrent(next)}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        style={{ borderRadius: 24 }}
        className={`overflow-hidden bg-(--em-ink-950) text-left shadow-lg outline-offset-4 ring-1 ring-(--em-ink-800) focus-visible:outline-2 focus-visible:outline-(--em-blue-400) ${
          wide ? "w-full max-w-xs px-3 py-2.5" : "px-5 py-3"
        }`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={current}
            layout="position"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Content state={current} />
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

export default Island;
