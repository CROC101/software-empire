"use client";

import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const slides = [
  { title: "น้ำขึ้น", tone: "bg-(--em-blue-700)" },
  { title: "หมอกเช้า", tone: "bg-(--em-ink-800)" },
  { title: "ฟ้าใส", tone: "bg-(--em-blue-500)" },
  { title: "กลางคืน", tone: "bg-(--em-ink-900)" },
];

/** Slides that change by a round shape swelling out from the button until it fills the frame. */
export default function ShapeSlider() {
  const [cur, setCur] = useState(0);
  const [next, setNext] = useState<number | null>(null);
  const now = slides[cur] ?? slides[0];
  const coming = next === null ? null : slides[next];
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <div
        className={`relative h-56 w-full max-w-md overflow-hidden rounded-xl ${now?.tone ?? ""}`}
      >
        <AnimatePresence>
          {coming && (
            <motion.span
              key={next}
              aria-hidden
              className={`absolute right-6 bottom-6 size-12 rounded-full ${coming.tone}`}
              initial={{ scale: 0 }}
              animate={{ scale: 22 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.7, 0, 0.3, 1] }}
              onAnimationComplete={() => {
                if (next !== null) setCur(next);
                setNext(null);
              }}
            />
          )}
        </AnimatePresence>
        <p
          className="absolute bottom-6 left-6 text-3xl font-black text-(--em-ink-0)"
          aria-live="polite"
        >
          {now?.title}
        </p>
        <button
          type="button"
          aria-label="สไลด์ถัดไป"
          disabled={next !== null}
          onClick={() => {
            setNext((cur + 1) % slides.length);
          }}
          className="absolute right-6 bottom-6 grid size-12 place-items-center rounded-full bg-(--em-ink-0) text-(--em-ink-900) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--em-sky-400)"
        >
          <ArrowRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
