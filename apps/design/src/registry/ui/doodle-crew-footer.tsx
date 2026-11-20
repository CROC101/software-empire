"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useRef, useState } from "react";

type Mate = { at: number; pose: "lean" | "sit" | "peek"; name: string; line: string };
const crew: Mate[] = [
  { at: 0, pose: "lean", name: "เจ้าหมึก", line: "วาดต่ออีกหน้าไหม" },
  { at: 3, pose: "sit", name: "เจ้ากลม", line: "นั่งตรงนี้สบายดี" },
  { at: 5, pose: "peek", name: "เจ้าแอบ", line: "จ๊ะเอ๋" },
  { at: 7, pose: "lean", name: "เจ้าเส้น", line: "แล้วเจอกันนะ" },
];
const shapes = [
  "M0 -9 L2.6 -2.8 9 -2.8 3.9 1.1 5.8 7.6 0 3.6 -5.8 7.6 -3.9 1.1 -9 -2.8 -2.6 -2.8 Z",
  "M-8 0 C-8 -6 0 -6 0 0 C0 6 8 6 8 0",
  "M0 7 C-10 0 -6 -9 0 -3 C6 -9 10 0 0 7 Z",
  "M-7 -7 L7 7 M7 -7 L-7 7",
  "M-8 4 C-4 -6 4 6 8 -4",
];
// fixed layout so server and client agree
const doodles = Array.from({ length: 10 }, (_, k) => ({
  k,
  d: shapes[k % shapes.length] ?? "",
  x: (k * 37 + 7) % 96,
  dur: 9 + ((k * 5) % 7),
  delay: -((k * 1.7) % 9),
  turn: k % 2 ? 160 : -200,
}));

function Face({ look, size = 1 }: { look: { x: number; y: number }; size?: number }) {
  return (
    <g>
      {[-7, 7].map((dx) => (
        <g key={dx} transform={`translate(${String(dx * size)} 0)`}>
          <circle
            r={5 * size}
            className="fill-(--em-ink-0) stroke-(--em-ink-975)"
            strokeWidth={2}
          />
          <motion.circle
            r={2.2 * size}
            animate={{ cx: look.x * 2.2 * size, cy: look.y * 2.2 * size }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fill-(--em-ink-975)"
          />
        </g>
      ))}
    </g>
  );
}

/**
 * The last page of a sketchbook: the brand stamped in giant ink, a small crew of hand-drawn
 * characters leaning on, sitting on and peeking over its letters, doodles drifting past. It
 * plays once in view: the ground line draws, letters stamp in, the crew pops up, then the copy.
 * Their eyes follow you, a click makes one hop and talk, a doodle you catch pops.
 */
export default function DoodleCrewFooter({ word = "CROCWORK" }: { word?: string }) {
  const still = useReducedMotionAfterMount();
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.4 });
  const on = seen || still;
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [talk, setTalk] = useState<number | null>(null);
  const [hop, setHop] = useState(0);
  const [popped, setPopped] = useState<Record<number, number>>({});
  const letters = word.toUpperCase().slice(0, 9).split("");
  const stampEnd = 0.6 + letters.length * 0.08;
  const t = (delay: number) =>
    still ? { duration: 0 } : { delay, type: "spring" as const, stiffness: 260, damping: 16 };

  return (
    <footer
      ref={ref}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setLook({
          x: ((e.clientX - r.left) / r.width) * 2 - 1,
          y: ((e.clientY - r.top) / r.height) * 2 - 1,
        });
      }}
      className="@container relative isolate flex size-full min-h-[34rem] flex-col justify-end overflow-clip bg-(--em-ink-25) px-6 pt-24 pb-8 text-(--em-ink-975)"
    >
      {/* drifting doodles: catch one and it pops, then comes back from the top */}
      {!still &&
        doodles.map((o) => (
          <motion.svg
            key={`${String(o.k)}-${String(popped[o.k] ?? 0)}`}
            viewBox="-10 -10 20 20"
            aria-hidden
            initial={{ y: "-10cqh", rotate: 0, opacity: 0 }}
            animate={{ y: "110cqh", rotate: o.turn, opacity: [0, 1, 1, 0] }}
            transition={{
              duration: o.dur,
              delay: popped[o.k] ? 0.6 : o.delay,
              repeat: Infinity,
              ease: "linear",
            }}
            onPointerDown={() => {
              setPopped((p) => ({ ...p, [o.k]: (p[o.k] ?? 0) + 1 }));
            }}
            style={{ left: `${String(o.x)}%` }}
            className="vt-live absolute top-0 size-7 cursor-pointer fill-none stroke-(--em-ink-400) [stroke-linecap:round] [stroke-linejoin:round]"
            strokeWidth={1.8}
          >
            <path d={o.d} />
          </motion.svg>
        ))}

      <div className="relative mx-auto w-full max-w-6xl">
        <p
          aria-hidden
          className="flex justify-center font-heading text-[clamp(3rem,15cqi,12rem)] leading-[0.8] font-black tracking-tight select-none"
        >
          {letters.map((c, i) => {
            const mates = crew.filter((m) => m.at === i);
            return (
              <motion.span
                key={`${c}${String(i)}`}
                initial={on ? false : { scale: 1.6, opacity: 0, rotate: -6 }}
                animate={on ? { scale: 1, opacity: 1, rotate: 0 } : {}}
                transition={t(0.6 + i * 0.08)}
                whileHover={still ? {} : { rotate: [0, -4, 3, 0], transition: { duration: 0.4 } }}
                className="relative inline-block"
              >
                {c}
                {mates.map((m) => {
                  const k = crew.indexOf(m);
                  const place =
                    m.pose === "sit"
                      ? "bottom-[88%] left-1/2 -translate-x-1/2"
                      : m.pose === "peek"
                        ? "bottom-[70%] left-1/2 -z-10 -translate-x-1/2"
                        : "-right-[18%] bottom-0";
                  return (
                    <motion.button
                      key={m.name}
                      type="button"
                      aria-label={`${m.name}: ${m.line}`}
                      initial={on ? false : { y: 40, opacity: 0 }}
                      animate={
                        on
                          ? {
                              // new peak per click so the hop replays
                              y: talk === k && hop && !still ? [0, -26 - (hop % 2) * 0.01, 0] : 0,
                              opacity: 1,
                            }
                          : {}
                      }
                      transition={talk === k ? { duration: 0.45 } : t(stampEnd + k * 0.15)}
                      onClick={() => {
                        setTalk(k);
                        setHop((h) => h + 1);
                      }}
                      className={`absolute ${place} w-[0.42em] text-[1em] outline-none focus-visible:outline-2 focus-visible:outline-(--em-blue-500)`}
                    >
                      <svg viewBox="-24 -26 48 52" className="w-full overflow-visible">
                        {m.pose === "lean" ? (
                          <path
                            d="M-14 24 C-18 4 -10 -20 4 -20 C16 -20 18 0 12 24 Z"
                            className="fill-(--em-blue-500) stroke-(--em-ink-975)"
                            strokeWidth={2.5}
                            transform="rotate(-12)"
                          />
                        ) : m.pose === "sit" ? (
                          <path
                            d="M-18 22 C-20 -4 -10 -18 0 -18 C10 -18 20 -4 18 22 Z M-14 22 L-16 30 M12 22 L14 30"
                            className="fill-(--em-gold-300) stroke-(--em-ink-975)"
                            strokeWidth={2.5}
                          />
                        ) : (
                          <path
                            d="M-18 26 C-18 -6 -8 -20 0 -20 C8 -20 18 -6 18 26 M-22 4 L-14 0 M22 4 L14 0"
                            className="fill-(--em-coral-400) stroke-(--em-ink-975)"
                            strokeWidth={2.5}
                          />
                        )}
                        <g transform="translate(0 -6)">
                          <motion.g
                            animate={still ? {} : { scaleY: [1, 1, 0.1, 1] }}
                            transition={{
                              duration: 4 + k,
                              times: [0, 0.94, 0.97, 1],
                              repeat: Infinity,
                            }}
                            className="vt-live"
                          >
                            <Face look={look} />
                          </motion.g>
                        </g>
                      </svg>
                      <AnimatePresence>
                        {talk === k && (
                          <motion.span
                            key={hop}
                            initial={{ opacity: 0, y: 6, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            onAnimationComplete={() => {
                              setTimeout(() => {
                                setTalk((v) => (v === k ? null : v));
                              }, 1800);
                            }}
                            className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 rounded-md border-2 border-(--em-ink-975) bg-(--em-ink-0) px-2 py-1 font-sans text-sm font-bold tracking-normal whitespace-nowrap"
                          >
                            {m.line}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </motion.span>
            );
          })}
        </p>
        <h2 className="sr-only">{word}</h2>

        {/* the ground line, drawn first */}
        <svg viewBox="0 0 1000 12" preserveAspectRatio="none" aria-hidden className="h-3 w-full">
          <motion.path
            d="M0 6 C200 2 320 10 500 6 C680 2 820 10 1000 5"
            initial={on ? false : { pathLength: 0 }}
            animate={on ? { pathLength: 1 } : {}}
            transition={still ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }}
            className="fill-none stroke-(--em-ink-975)"
            strokeWidth={3}
            strokeLinecap="round"
          />
        </svg>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
          <p className="max-w-md text-lg text-(--em-ink-700)">
            {"สตูดิโอเล็ก ๆ ที่วาดก่อนเขียนโค้ดเสมอ".split(" ").map((w, i) => (
              <motion.span
                key={w}
                initial={on ? false : { opacity: 0, y: 10 }}
                animate={on ? { opacity: 1, y: 0 } : {}}
                transition={still ? { duration: 0 } : { delay: stampEnd + 0.8 + i * 0.08 }}
                className="inline-block pe-[0.3em]"
              >
                {w}
              </motion.span>
            ))}
          </p>
          <motion.div
            initial={on ? false : { opacity: 0, y: 16 }}
            animate={on ? { opacity: 1, y: 0 } : {}}
            transition={still ? { duration: 0 } : { delay: stampEnd + 1.2 }}
            className="flex gap-3"
          >
            <a
              href="#top"
              className="rounded-md border-2 border-(--em-ink-975) bg-(--em-ink-975) px-5 py-2.5 font-bold text-(--em-ink-0) hover:bg-(--em-ink-800)"
            >
              กลับขึ้นบน
            </a>
            <a
              href="#contact"
              className="rounded-md border-2 border-(--em-ink-975) px-5 py-2.5 font-bold hover:bg-(--em-ink-100)"
            >
              ทักทาย
            </a>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
