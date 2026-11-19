"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, PanelLeftClose, Plus } from "lucide-react";
import { ALL_TAGS } from "@/data/seed-media";

export const DURATIONS = ["All", "0–10 min", "10–30 min", "30+ min"] as const;
export type DurationFilter = (typeof DURATIONS)[number];
export const FLAGS = ["4K Ultra HD", "60 FPS", "Verified Creators Only", "Full Length"] as const;
export type Flag = (typeof FLAGS)[number];

export interface TagFilterState {
  include: string[];
  exclude: string[];
  duration: DurationFilter;
  flags: Flag[];
}

export function MultiTagSidebar({
  state,
  onTag,
  onDuration,
  onFlag,
  open,
  onClose,
}: {
  state: TagFilterState;
  onTag: (tag: string, mode: "include" | "exclude") => void;
  onDuration: (d: DurationFilter) => void;
  onFlag: (f: Flag) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "auto", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 450, damping: 32 }}
          className="shrink-0 overflow-hidden"
          aria-label="Filters"
        >
          <div className="w-full rounded-[3px] border border-hairline bg-surface p-4 lg:w-[260px]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Filters</h2>
              <button onClick={onClose} aria-label="Hide filters" className="text-ink hover:text-brand">
                <PanelLeftClose className="h-5 w-5" />
              </button>
            </div>

            <h3 className="mb-2 text-2xs font-bold uppercase text-muted">Tags (+ require / − exclude)</h3>
            <ul className="space-y-1">
              {ALL_TAGS.map((t) => {
                const inc = state.include.includes(t);
                const exc = state.exclude.includes(t);
                return (
                  <li key={t} className={`flex items-center gap-2 rounded-[3px] px-2 py-1 ${inc ? "bg-brand/15" : exc ? "bg-red-500/10" : ""}`}>
                    <span className={`flex-1 text-md ${inc ? "font-bold text-brand" : exc ? "text-red-400 line-through" : "text-ink"}`}>#{t}</span>
                    <button
                      onClick={() => onTag(t, "include")}
                      aria-label={`Require ${t}`}
                      aria-pressed={inc}
                      className={`flex h-6 w-6 items-center justify-center rounded-[2px] ${inc ? "bg-brand text-black" : "bg-pill text-ink hover:bg-pill-hover"}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onTag(t, "exclude")}
                      aria-label={`Exclude ${t}`}
                      aria-pressed={exc}
                      className={`flex h-6 w-6 items-center justify-center rounded-[2px] ${exc ? "bg-red-500 text-white" : "bg-pill text-ink hover:bg-pill-hover"}`}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>

            <h3 className="mb-2 mt-5 text-2xs font-bold uppercase text-muted">Duration</h3>
            <input
              type="range"
              min={0}
              max={3}
              step={1}
              value={DURATIONS.indexOf(state.duration)}
              onChange={(e) => onDuration(DURATIONS[Number(e.target.value)])}
              aria-label="Duration range"
              aria-valuetext={state.duration}
              className="w-full"
            />
            <div className="mt-1 grid grid-cols-4 gap-1">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => onDuration(d)}
                  className={`rounded-[2px] px-1 py-1 text-[10px] font-bold ${d === state.duration ? "bg-brand text-black" : "bg-pill text-ink hover:bg-pill-hover"}`}
                >
                  {d}
                </button>
              ))}
            </div>

            <h3 className="mb-2 mt-5 text-2xs font-bold uppercase text-muted">Quality & Production</h3>
            <ul className="space-y-2">
              {FLAGS.map((f) => (
                <li key={f}>
                  <label className="flex cursor-pointer items-center gap-2 text-md text-ink">
                    <input type="checkbox" checked={state.flags.includes(f)} onChange={() => onFlag(f)} className="h-4 w-4 accent-[#ff9000]" />
                    {f}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
