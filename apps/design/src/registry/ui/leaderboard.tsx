"use client";

import { Shuffle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const start = [
  { name: "นิล", score: 980 },
  { name: "ฟ้า", score: 870 },
  { name: "ต้น", score: 820 },
  { name: "มิ้นท์", score: 760 },
  { name: "บอส", score: 640 },
];
const medal = ["bg-(--em-gold-500)", "bg-(--em-ink-300)", "bg-(--em-coral-400)"];

/** Rows glide to their new places when scores change (layout animation). Press the button to play a round. */
export default function Leaderboard() {
  const [rows, setRows] = useState(start);
  const [round, setRound] = useState(1);
  const play = () => {
    setRows((r) =>
      r
        .map((p, i) => ({ ...p, score: p.score + ((round * 37 + i * 53) % 260) }))
        .sort((a, b) => b.score - a.score),
    );
    setRound((n) => n + 1);
  };
  return (
    <div className="grid size-full min-h-96 place-items-center bg-(--em-ink-975) p-6">
      <div className="w-full max-w-xs">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-heading text-lg font-black text-(--em-ink-50)">อันดับ</p>
          <button
            type="button"
            onClick={play}
            className="inline-flex items-center gap-1.5 rounded-lg bg-(--em-blue-600) px-3 py-1.5 text-sm font-semibold text-(--em-ink-0)"
          >
            <Shuffle aria-hidden className="size-4" />
            เล่นรอบ {round}
          </button>
        </div>
        <ol aria-live="polite" className="space-y-2">
          {rows.map((p, i) => (
            <motion.li
              key={p.name}
              layout
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="flex items-center gap-3 rounded-lg border border-(--em-ink-800) bg-(--em-ink-900) px-3 py-2.5"
            >
              <span
                className={`grid size-7 place-items-center rounded-full text-xs font-bold ${medal[i] ?? "bg-(--em-ink-800)"} ${i < 3 ? "text-(--em-ink-950)" : "text-(--em-ink-300)"}`}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-(--em-ink-100)">{p.name}</span>
              <span className="font-mono text-sm text-(--em-sky-400) tabular-nums">{p.score}</span>
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
}
