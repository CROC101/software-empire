"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Music2, Phone, Timer } from "lucide-react";

export interface FloatingCommandIslandProps {
  initialState?: "idle" | "call" | "music" | "timer";
  autoCycle?: boolean;
  interval?: number;
  accent?: string;
}

const STATES = {
  idle: { w: 120, h: 36 },
  call: { w: 320, h: 64 },
  music: { w: 340, h: 150 },
  timer: { w: 220, h: 44 },
} as const;

type IslandState = keyof typeof STATES;
const ORDER: IslandState[] = ["idle", "call", "music", "timer"];

export function FloatingCommandIsland({
  initialState = "idle",
  autoCycle = true,
  interval = 2.6,
  accent = "#22c55e",
}: FloatingCommandIslandProps) {
  const [state, setState] = useState<IslandState>(initialState);

  useEffect(() => setState(initialState), [initialState]);
  useEffect(() => {
    if (!autoCycle) return;
    const id = window.setInterval(() => setState((s) => ORDER[(ORDER.indexOf(s) + 1) % ORDER.length]), interval * 1000);
    return () => window.clearInterval(id);
  }, [autoCycle, interval]);

  const { w, h } = STATES[state];
  return (
    <div className="flex w-full flex-col items-center gap-6 p-6">
      <motion.button
        type="button"
        onClick={() => setState((s) => ORDER[(ORDER.indexOf(s) + 1) % ORDER.length])}
        animate={{ width: w, height: h, borderRadius: state === "music" ? 32 : 999 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative max-w-full overflow-hidden bg-black text-left text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
        aria-label={`Island: ${state}`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={state}
            initial={{ opacity: 0, filter: "blur(6px)", scale: 0.9 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, filter: "blur(6px)", scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 flex items-center gap-3 px-4"
          >
            {state === "idle" && <span className="mx-auto size-2 rounded-full" style={{ background: accent }} />}
            {state === "call" && (
              <>
                <span className="flex size-9 items-center justify-center rounded-full bg-zinc-800 text-xs">AL</span>
                <span className="flex-1 text-sm">
                  <span className="block text-zinc-400 text-xs">Incoming call</span>Alex Lane
                </span>
                <span className="flex size-9 items-center justify-center rounded-full" style={{ background: accent }}>
                  <Phone className="size-4" />
                </span>
              </>
            )}
            {state === "music" && (
              <div className="flex w-full flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="size-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-500" />
                  <span className="flex-1 text-sm">
                    <span className="block font-medium">Night Drive</span>
                    <span className="text-xs text-zinc-400">Synthwave Radio</span>
                  </span>
                  <Music2 className="size-5" style={{ color: accent }} />
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
                  <motion.div className="h-full" style={{ background: accent }} initial={{ width: "10%" }} animate={{ width: "70%" }} transition={{ duration: interval }} />
                </div>
              </div>
            )}
            {state === "timer" && (
              <>
                <Timer className="size-4" style={{ color: accent }} />
                <span className="flex-1 font-mono text-sm tabular-nums">04:59</span>
                <Bell className="size-4 text-zinc-400" />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>
      <p className="text-xs text-zinc-500">Click the island to change state</p>
    </div>
  );
}

export default FloatingCommandIsland;
