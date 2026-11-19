"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

const floats = [
  "top-[12%] left-[8%] size-6 rounded-full bg-(--em-blue-500)/50",
  "top-[20%] right-[10%] size-10 rounded-md border border-(--em-ink-700)",
  "bottom-[18%] left-[16%] size-8 rounded-md bg-(--em-ink-800)",
  "bottom-[12%] right-[18%] size-5 rounded-full border border-(--em-sky-400)/60",
];

/**
 * A two-line headline whose words fill from dim to bright, one after another, once it comes into
 * view (opacity only: a bright copy fades in over a dim one, so the line never reflows). A few quiet
 * shapes drift round it.
 */
export default function InkFillHeadline({
  line1 = "เราเขียนโค้ดเหมือนเขียนจดหมาย",
  line2 = "ช้าพอจะอ่านซ้ำได้",
  speed = 1,
}: {
  line1?: string;
  line2?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.5 });
  const still = useReducedMotionAfterMount();
  const words = [...line1.split(" "), "\n", ...line2.split(" ")];
  let n = 0;

  return (
    <div className="@container relative grid size-full min-h-[24rem] place-items-center overflow-clip bg-(--em-ink-975) px-6 py-16">
      <style>{`@keyframes if-bob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-12px) rotate(8deg)}}.if-float{animation:if-bob 7s ease-in-out infinite}@media (prefers-reduced-motion:reduce){.if-float{animation:none}}`}</style>
      {floats.map((f, i) => (
        <span
          key={f}
          aria-hidden
          className={`if-float vt-live absolute ${f}`}
          style={{ animationDelay: `-${String(i * 1.6)}s` }}
        />
      ))}

      <div ref={ref} className="relative max-w-3xl text-center">
        <p className="sr-only">
          {line1} {line2}
        </p>
        <p aria-hidden className="font-heading text-4xl leading-tight font-black @lg:text-6xl">
          {words.map((w, i) => {
            if (w === "\n") return <br key={i} />;
            const k = n++;
            return (
              <span key={i} className="relative mr-[0.25em] inline-block">
                <span className="text-(--em-ink-800)">{w}</span>
                <motion.span
                  className="absolute inset-0 text-(--em-ink-50)"
                  initial={false}
                  animate={{ opacity: seen || still ? 1 : 0 }}
                  transition={
                    still ? { duration: 0 } : { duration: 0.5 / speed, delay: (k * 0.18) / speed }
                  }
                >
                  {w}
                </motion.span>
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
