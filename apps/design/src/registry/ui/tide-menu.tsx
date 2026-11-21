"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

const rows = ["เว็บไซต์", "แอปมือถือ", "ร้านออนไลน์", "ระบบหลังบ้าน"];

/** A big text menu: hovering a row fills it with a band that comes in from the side you entered, with the word running across it. */
export default function TideMenu({ speed = 8 }: { speed?: number }) {
  const still = useReducedMotion();
  const [hot, setHot] = useState<{ k: number; from: 1 | -1 } | null>(null);
  return (
    <div className="grid size-full min-h-80 place-items-center bg-(--em-ink-975) p-6">
      <nav aria-label="บริการ" className="w-full max-w-lg border-t border-(--em-ink-800)">
        {rows.map((r, k) => {
          const on = hot?.k === k;
          return (
            <a
              key={r}
              href="#"
              onClick={(e) => {
                e.preventDefault();
              }}
              onPointerEnter={(e) => {
                const b = e.currentTarget.getBoundingClientRect();
                setHot({ k, from: e.clientY < b.top + b.height / 2 ? -1 : 1 });
              }}
              onPointerLeave={() => {
                setHot(null);
              }}
              className="relative block overflow-hidden border-b border-(--em-ink-800) py-5 text-center text-2xl font-black text-(--em-ink-0) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
            >
              {r}
              <motion.span
                aria-hidden
                initial={false}
                animate={{ y: on ? "0%" : `${String((hot?.k === k ? hot.from : 1) * 101)}%` }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 flex items-center overflow-hidden bg-(--em-ink-0)"
              >
                <motion.span
                  className={`flex shrink-0 gap-8 pr-8 whitespace-nowrap text-(--em-ink-900) ${on && !still ? "vt-live" : ""}`}
                  animate={on && !still ? { x: ["0%", "-50%"] } : { x: "0%" }}
                  transition={{ duration: speed, ease: "linear", repeat: Infinity }}
                >
                  {Array.from({ length: 8 }, (_, i) => (
                    <span key={i}>{r} ·</span>
                  ))}
                </motion.span>
              </motion.span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
