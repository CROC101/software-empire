"use client";

import { Search, X } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";

/** A magnifier that opens into a search field; Esc or the cross folds it back. */
export default function SearchExpand() {
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <motion.div
        animate={{ width: open ? 280 : 48 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onAnimationComplete={() => {
          if (open) input.current?.focus();
        }}
        className="flex h-12 max-w-full items-center overflow-hidden rounded-lg border border-(--em-ink-700) bg-(--em-ink-900)"
      >
        <button
          type="button"
          aria-label="ค้นหา"
          aria-expanded={open}
          onClick={() => {
            setOpen(true);
          }}
          className="grid size-12 shrink-0 place-items-center text-(--em-ink-200)"
        >
          <Search aria-hidden className="size-5" />
        </button>
        <input
          ref={input}
          type="search"
          tabIndex={open ? 0 : -1}
          aria-label="คำค้น"
          placeholder="ค้นหาคอมโพเนนต์"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-(--em-ink-50) outline-none placeholder:text-(--em-ink-500)"
        />
        {open && (
          <button
            type="button"
            aria-label="ปิดช่องค้นหา"
            onClick={() => {
              setOpen(false);
            }}
            className="grid size-10 shrink-0 place-items-center text-(--em-ink-400) hover:text-(--em-ink-100)"
          >
            <X aria-hidden className="size-4" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
