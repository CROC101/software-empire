"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useId, useState } from "react";

/** Page numbers with a sliding marker; previous and next stop at the ends. */
export default function Pager({ pages = 7 }: { pages?: number }) {
  const [page, setPage] = useState(1);
  const id = useId();
  const n = Math.max(1, Math.round(pages));
  const go = (p: number) => {
    setPage(Math.min(n, Math.max(1, p)));
  };
  const btn = "grid size-10 place-items-center rounded-md text-sm font-semibold";
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <nav
        aria-label="เลขหน้า"
        className="flex max-w-full flex-wrap items-center justify-center gap-1"
      >
        <button
          type="button"
          aria-label="หน้าก่อน"
          disabled={page === 1}
          onClick={() => {
            go(page - 1);
          }}
          className={`${btn} text-(--em-ink-200) hover:bg-(--em-ink-800) disabled:opacity-30`}
        >
          <ChevronLeft aria-hidden className="size-4" />
        </button>
        {Array.from({ length: n }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => {
              go(p);
            }}
            className={`${btn} relative ${p === page ? "text-(--em-ink-0)" : "text-(--em-ink-300) hover:bg-(--em-ink-800)"}`}
          >
            {p === page && (
              <motion.span
                layoutId={`${id}-mark`}
                className="absolute inset-0 rounded-md bg-(--em-blue-600)"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative">{p}</span>
          </button>
        ))}
        <button
          type="button"
          aria-label="หน้าถัดไป"
          disabled={page === n}
          onClick={() => {
            go(page + 1);
          }}
          className={`${btn} text-(--em-ink-200) hover:bg-(--em-ink-800) disabled:opacity-30`}
        >
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </nav>
    </div>
  );
}
