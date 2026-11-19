"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { LANGUAGES } from "./nav";
import { SPRING } from "./TopHeader";

/** Small language picker (gate corner + footer). Opens downward or upward. */
export function LanguageMenu({ up = false }: { up?: boolean }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("English");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const on = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", on);
    return () => document.removeEventListener("mousedown", on);
  }, []);
  return (
    <div ref={ref} onClick={() => setOpen((o) => !o)} className="relative inline-block cursor-pointer">
      <button
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-[22px] items-center gap-[5px] rounded-[2px] bg-chip px-[6px] text-sm font-bold text-white"
      >
        <Globe className="h-[13px] w-[13px] text-muted" />
        {lang}
        <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true" className="ml-[2px] fill-white">
          <path d="M0 0h10L5 6z" />
        </svg>
      </button>
      {/* List stays in the DOM (hidden when closed) so the control reads like the original. */}
          <motion.ul
            role="listbox"
            inert={!open}
            style={{ pointerEvents: open ? "auto" : "none" }}
            initial={false}
            animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: up ? 6 : -6 }}
            transition={SPRING}
            className={`absolute left-0 z-[80] max-h-[70vh] w-[117px] overflow-y-auto bg-chip shadow-[0_4px_16px_rgba(0,0,0,0.6)] ${
              up ? "bottom-[30px]" : "top-[35px]"
            }`}
          >
            {LANGUAGES.map((l) => (
              <li key={l} className="border-b border-black/40">
                <button
                  role="option"
                  aria-selected={l === lang}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLang(l);
                    setOpen(false);
                  }}
                  className={`block h-[40px] w-full px-[20px] text-left text-base hover:bg-pill-hover ${l === lang ? "text-brand" : "text-white"}`}
                >
                  {l}
                </button>
              </li>
            ))}
          </motion.ul>
    </div>
  );
}
