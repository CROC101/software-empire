"use client";

import { motion } from "motion/react";
import { useId, useRef, useState } from "react";

const slides = [
  { title: "ฤดูฝน", tone: "from-(--em-blue-700) to-(--em-ink-950)" },
  { title: "ฤดูหนาว", tone: "from-(--em-sky-500) to-(--em-blue-800)" },
  { title: "ฤดูร้อน", tone: "from-(--em-gold-500) to-(--em-coral-500)" },
  { title: "ลอยกระทง", tone: "from-(--em-violet-600) to-(--em-ink-950)" },
];

/** Native scroll-snap slides (swipe, wheel or keys); the dots follow the scroll and jump on press. */
export default function SnapCarousel() {
  const track = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const id = useId();
  const go = (i: number) => {
    const el = track.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <div className="w-full max-w-md">
        <div
          ref={track}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="ฤดูกาล"
          onScroll={(e) => {
            const el = e.currentTarget;
            setAt(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-xl [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
        >
          {slides.map((s, i) => (
            <section
              key={s.title}
              aria-roledescription="slide"
              aria-label={`${String(i + 1)} จาก ${String(slides.length)}`}
              className={`grid aspect-video w-full shrink-0 snap-center place-items-end bg-linear-to-br p-5 ${s.tone}`}
            >
              <p className="justify-self-start font-heading text-2xl font-black text-(--em-ink-0)">
                {s.title}
              </p>
            </section>
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-label={`ไปสไลด์ ${s.title}`}
              aria-current={i === at}
              onClick={() => {
                go(i);
              }}
              className="relative h-2 w-6 overflow-hidden rounded-full bg-(--em-ink-800)"
            >
              {i === at && (
                <motion.span
                  layoutId={`${id}-dot`}
                  className="absolute inset-0 rounded-full bg-(--em-sky-400)"
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
