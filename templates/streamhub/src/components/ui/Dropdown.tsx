"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export function Dropdown<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const on = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", on);
    return () => document.removeEventListener("mousedown", on);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-[32px] items-center gap-2 rounded-[3px] bg-pill px-3 text-sm text-ink hover:bg-pill-hover"
      >
        <span className="text-muted">{label}:</span> <span className="font-bold text-white">{value}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
            className="absolute right-0 top-[36px] z-30 min-w-[160px] overflow-hidden rounded-[3px] border border-hairline bg-surface-2 py-1"
          >
            {options.map((o) => (
              <li key={o}>
                <button
                  role="option"
                  aria-selected={o === value}
                  onClick={() => {
                    onChange(o);
                    setOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-pill-hover ${o === value ? "text-brand" : "text-ink"}`}
                >
                  {o}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Pill({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`h-[32px] shrink-0 rounded-pill px-[14px] text-md font-bold transition-colors ${
        active ? "bg-brand text-black" : "bg-pill text-ink hover:bg-pill-hover hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export const SORTS = ["Most Viewed", "Top Rated", "Most Recent", "Longest"] as const;
export type Sort = (typeof SORTS)[number];
