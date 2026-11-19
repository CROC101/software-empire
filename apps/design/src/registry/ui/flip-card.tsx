"use client";

import { motion } from "motion/react";
import { useState } from "react";

/** A card with two faces. Flips on hover or on press; the button keeps it usable by keyboard either way. */
export default function FlipCard({ trigger = "hover" }: { trigger?: "hover" | "click" }) {
  const [flipped, setFlipped] = useState(false);
  const hover = trigger === "hover";

  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6 [perspective:1000px]">
      <motion.button
        type="button"
        aria-pressed={flipped}
        aria-label="พลิกการ์ด"
        onClick={() => {
          setFlipped((f) => !f);
        }}
        onHoverStart={
          hover
            ? () => {
                setFlipped(true);
              }
            : undefined
        }
        onHoverEnd={
          hover
            ? () => {
                setFlipped(false);
              }
            : undefined
        }
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 18 }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative h-72 w-56 text-left"
      >
        <span className="absolute inset-0 flex flex-col justify-end rounded-xl border border-(--em-ink-700) bg-linear-to-br from-(--em-blue-600) to-(--em-blue-900) p-5 [backface-visibility:hidden]">
          <span className="font-mono text-xs tracking-[0.2em] text-(--em-sky-400) uppercase">
            Front
          </span>
          <span className="font-heading text-2xl font-black text-(--em-ink-0)">ด้านหน้า</span>
        </span>
        <span className="absolute inset-0 flex flex-col justify-center gap-2 rounded-xl border border-(--em-ink-700) bg-(--em-ink-900) p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="font-heading text-xl font-black text-(--em-ink-50)">ด้านหลัง</span>
          <span className="text-sm text-(--em-ink-300)">ใส่รายละเอียด ราคา หรือปุ่มต่อได้</span>
        </span>
      </motion.button>
    </div>
  );
}
