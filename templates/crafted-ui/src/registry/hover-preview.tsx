"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface HoverPreviewProps {
  previewWidth?: number;
  showCaption?: boolean;
  accent?: string;
}

const LINKS = [
  { word: "mountains", from: "#0ea5e9", to: "#1e3a8a", caption: "Alpine ridge at dawn" },
  { word: "desert", from: "#f59e0b", to: "#9a3412", caption: "Dunes after sunset" },
  { word: "forest", from: "#22c55e", to: "#14532d", caption: "Old-growth canopy" },
];

export function HoverPreview({ previewWidth = 220, showCaption = true, accent = "#a78bfa" }: HoverPreviewProps) {
  const [active, setActive] = useState<number | null>(null);
  return (
    <div className="flex w-full items-center justify-center p-8 pt-40">
      <p className="max-w-md text-center text-lg leading-relaxed text-zinc-400">
        We travelled through{" "}
        {LINKS.map((l, i) => (
          <span key={l.word}>
            <span
              className="relative cursor-pointer font-medium text-white underline decoration-dotted underline-offset-4"
              style={{ textDecorationColor: accent }}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
            >
              {l.word}
              <AnimatePresence>
                {active === i && (
                  <motion.span
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-3 -translate-x-1/2 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 p-1.5 shadow-2xl"
                    style={{ width: previewWidth }}
                  >
                    <span className="block aspect-[4/3] rounded-lg" style={{ background: `linear-gradient(135deg, ${l.from}, ${l.to})` }} />
                    {showCaption && <span className="block px-1 pt-1.5 text-left text-xs font-normal text-zinc-400 no-underline">{l.caption}</span>}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            {i < LINKS.length - 2 ? ", " : i === LINKS.length - 2 ? " and " : ""}
          </span>
        ))}{" "}
        in one long summer.
      </p>
    </div>
  );
}

export default HoverPreview;
