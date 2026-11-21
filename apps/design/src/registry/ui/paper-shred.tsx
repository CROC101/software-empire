"use client";

import { motion } from "motion/react";
import { useState } from "react";

const lines = ["ใบเสนอราคา #2026-114", "ค่าออกแบบ 18,000", "ค่าพัฒนา 42,000", "รวม 60,000 บาท"];
const W = 180;
const H = 100;

/** A sheet feeds into a slot and comes out underneath as strips that drift down and fade. */
export default function PaperShred({ strips = 10 }: { strips?: number }) {
  const [shred, setShred] = useState(false);
  const [round, setRound] = useState(0);
  return (
    <div className="grid size-full min-h-80 place-items-center bg-(--em-ink-975) p-6">
      <div className="flex flex-col items-center gap-4">
        <div style={{ width: W + 40 }}>
          {/* the sheet is clipped at the slot, so it looks like it goes in */}
          <div className="overflow-hidden" style={{ height: H + 8 }}>
            <motion.div
              key={round}
              initial={{ y: 8 }}
              animate={{ y: shred ? H + 8 : 8 }}
              transition={{ duration: 1.4, ease: "linear" }}
              className="mx-auto flex flex-col gap-1 rounded-sm bg-(--em-ink-50) p-3"
              style={{ width: W, height: H }}
            >
              {lines.map((l) => (
                <p key={l} className="text-xs text-(--em-ink-700)">
                  {l}
                </p>
              ))}
            </motion.div>
          </div>
          <div className="relative z-10 flex h-5 items-center rounded-md bg-(--em-ink-700) px-3">
            <span className="h-0.5 w-full rounded-full bg-(--em-ink-950)" />
          </div>
          <div
            aria-hidden
            className="flex justify-center overflow-hidden"
            style={{ height: H + 24 }}
          >
            {Array.from({ length: strips }, (_, i) => (
              <motion.span
                key={`${String(round)}-${String(i)}`}
                className="block border-x border-(--em-ink-200) bg-(--em-ink-50)"
                style={{ width: W / strips, height: H }}
                initial={{ y: -H }}
                animate={
                  shred
                    ? {
                        y: [-H, 0, 24],
                        rotate: [0, 0, (i % 2 ? 1 : -1) * (2 + (i % 3))],
                        opacity: [1, 1, 0],
                      }
                    : { y: -H }
                }
                transition={{ duration: 2.4, times: [0, 0.6, 1], ease: "linear" }}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (shred) setRound((r) => r + 1);
            setShred(!shred);
          }}
          className="rounded-md bg-(--em-ink-800) px-4 py-2 text-sm text-(--em-ink-100) hover:bg-(--em-ink-700) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
        >
          {shred ? "ใส่กระดาษใหม่" : "ทำลายเอกสาร"}
        </button>
        <p className="sr-only" aria-live="polite">
          {shred ? "ทำลายเอกสารแล้ว" : ""}
        </p>
      </div>
    </div>
  );
}
