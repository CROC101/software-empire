"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";

const links = ["ผลงาน", "บริการ", "บทความ", "ติดต่อ"];

/** A top nav whose underline follows the pointer, then settles back under the current page. */
export default function UnderlineNav() {
  const [current, setCurrent] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const id = useId();
  const shown = hover ?? current;
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <nav
        aria-label="เมนูบน"
        onPointerLeave={() => {
          setHover(null);
        }}
        className="flex gap-6"
      >
        {links.map((l, i) => (
          <a
            key={l}
            href="#top"
            aria-current={current === i ? "page" : undefined}
            onClick={(e) => {
              e.preventDefault();
              setCurrent(i);
            }}
            onPointerEnter={() => {
              setHover(i);
            }}
            onFocus={() => {
              setHover(i);
            }}
            onBlur={() => {
              setHover(null);
            }}
            className={`relative py-2 text-sm font-semibold transition-colors ${shown === i ? "text-(--em-ink-50)" : "text-(--em-ink-400)"}`}
          >
            {l}
            {shown === i && (
              <motion.span
                layoutId={`${id}-line`}
                className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-(--em-sky-400)"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </a>
        ))}
      </nav>
    </div>
  );
}
