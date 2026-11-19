"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const stats = [
  { v: 133, s: "", l: "ชิ้นส่วน" },
  { v: 48, s: "", l: "โปรเจกต์ที่ส่งแล้ว" },
  { v: 98, s: "%", l: "ลูกค้ากลับมาจ้างซ้ำ" },
  { v: 24, s: " ชม.", l: "ตอบกลับภายใน" },
];

function Count({ to, suffix, run }: { to: number; suffix: string; run: boolean }) {
  const [n, setN] = useState(0);
  const still = useReducedMotion();
  useEffect(() => {
    if (!run) return;
    const c = animate(0, to, {
      duration: still ? 0 : 1.4,
      ease: "easeOut",
      onUpdate: (x) => {
        setN(Math.round(x));
      },
    });
    return () => {
      c.stop();
    };
  }, [run, to, still]);
  return (
    <span className="tabular-nums">
      {n}
      {suffix}
    </span>
  );
}

/** Big numbers on a dark band that count up the first time the band scrolls into view. */
export default function StatsBand() {
  const box = useRef<HTMLDListElement>(null);
  const seen = useInView(box, { once: true, amount: 0.4 });
  return (
    <section className="bg-(--em-ink-975) text-(--em-ink-0) @container">
      <dl
        ref={box}
        className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-16 @3xl:grid-cols-4"
      >
        {stats.map((s) => (
          <div key={s.l} className="flex flex-col-reverse gap-1">
            <dt className="text-sm text-(--em-ink-400)">{s.l}</dt>
            <dd className="font-heading text-4xl font-black text-(--em-sky-400) @3xl:text-5xl">
              <span className="sr-only">
                {s.v}
                {s.s}
              </span>
              <span aria-hidden>
                <Count to={s.v} suffix={s.s} run={seen} />
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
