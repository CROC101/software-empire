"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef, useState } from "react";

const shots = [
  { slug: "aurora-tide", kicker: "Shader", title: "Aurora Tide" },
  { slug: "deep-galaxy", kicker: "Particles", title: "Deep Galaxy" },
  { slug: "where-globe", kicker: "Map", title: "Where Globe" },
  { slug: "warp-lanes", kicker: "Canvas", title: "Warp Lanes" },
  { slug: "ripple-pond", kicker: "Water", title: "Ripple Pond" },
  { slug: "tide-plasma", kicker: "Shader", title: "Tide Plasma" },
  { slug: "particle-title", kicker: "Type", title: "Particle Title" },
  { slug: "ripple-mesh", kicker: "Mesh", title: "Ripple Mesh" },
];
const n = shots.length;

/** Signed distance of card k from the scroll position, the short way round the loop. */
function dist(k: number, pos: number) {
  return ((((k - pos) % n) + n * 1.5) % n) - n / 2;
}
const wrap = (i: number) => ((i % n) + n) % n;

function Card({
  k,
  pos,
  bend,
  onPick,
}: {
  k: number;
  pos: MotionValue<number>;
  bend: number;
  onPick: (k: number) => void;
}) {
  const s = shots[k];
  const d = useTransform(pos, (p) => dist(k, p));
  const x = useTransform(d, (v) => `${v * 108}%`);
  const rotateY = useTransform(d, (v) => -Math.max(-3, Math.min(3, v)) * 24 * bend);
  const scaleY = useTransform(d, (v) => 1 + Math.min(Math.abs(v), 3) * 0.1 * bend);
  const z = useTransform(d, (v) => -Math.min(Math.abs(v), 3) * 70 * bend);
  const opacity = useTransform(d, (v) => Math.max(0, Math.min(1, 3.4 - Math.abs(v))));
  const zIndex = useTransform(d, (v) => 50 - Math.round(Math.abs(v) * 10));
  // the lens splits colour at its rim: two tinted copies slide apart as a card leaves the centre
  const fringe = useTransform(d, (v) => Math.min(Math.abs(v), 2) * 0.3 * bend);
  const left = useTransform(d, (v) => -v * 5 * bend);
  const right = useTransform(d, (v) => v * 5 * bend);
  if (!s) return null;
  return (
    <motion.button
      type="button"
      tabIndex={-1}
      aria-hidden
      onClick={() => {
        onPick(k);
      }}
      style={{ x, rotateY, scaleY, z, opacity, zIndex }}
      className="absolute inset-0 m-auto aspect-[4/5] w-[min(56vw,17rem)] cursor-grab [transform-style:preserve-3d] active:cursor-grabbing"
    >
      <motion.span
        style={{ x: left, opacity: fringe }}
        className="absolute inset-0 rounded-xl bg-(--em-sky-400) mix-blend-screen"
      />
      <motion.span
        style={{ x: right, opacity: fringe }}
        className="absolute inset-0 rounded-xl bg-(--em-blue-700) mix-blend-screen"
      />
      <img
        src={`/orbit/${s.slug}.webp`}
        alt=""
        draggable={false}
        className="relative size-full rounded-xl object-cover shadow-2xl"
      />
    </motion.button>
  );
}

/**
 * A photo carousel seen through a curved lens: the middle card reads flat, and the further a card
 * travels from the centre the taller, deeper and more turned it grows, with a colour fringe at the
 * rim. Drag or flick (it settles on the nearest card), arrow keys or the buttons; it loops.
 */
export default function CurvedLens({ bend = 1 }: { bend?: number }) {
  const still = useReducedMotionAfterMount();
  const pos = useMotionValue(0);
  const [i, setI] = useState(0);
  const start = useRef(0);
  const stage = useRef<HTMLDivElement>(null);

  const settle = (to: number) => {
    setI(wrap(to));
    void animate(
      pos,
      to,
      still ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 26 },
    );
  };
  const step = (by: number) => {
    settle(Math.round(pos.get()) + by);
  };
  const cardW = () => (stage.current?.offsetWidth ?? 900) * 0.3;
  const s = shots[i] ?? shots[0];
  if (!s) return null;

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="ผลงานผ่านเลนส์โค้ง"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") step(1);
        else if (e.key === "ArrowLeft") step(-1);
      }}
      className="@container relative isolate flex size-full min-h-[36rem] flex-col overflow-clip bg-(--em-ink-975) py-8 text-(--em-ink-50) outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--em-sky-400)"
    >
      <div className="flex items-center justify-between px-6">
        <p className="font-mono text-xs tracking-[0.2em] text-(--em-sky-400) uppercase">
          Curved lens
        </p>
        <p className="font-mono text-xs text-(--em-ink-400) tabular-nums">
          {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
        </p>
      </div>

      <motion.div
        ref={stage}
        className="relative min-h-80 flex-1 touch-pan-y [perspective:1100px] select-none"
        onPanStart={() => {
          start.current = pos.get();
          pos.stop();
        }}
        onPan={(_, { offset }) => {
          pos.set(start.current - offset.x / cardW());
        }}
        onPanEnd={(_, { velocity }) => {
          const flick = -velocity.x / cardW() / 4;
          const raw = pos.get() + Math.max(-2, Math.min(2, flick));
          settle(Math.round(raw));
        }}
      >
        <div className="absolute inset-0 [transform-style:preserve-3d]">
          {shots.map((x, k) => (
            <Card
              key={x.slug}
              k={k}
              pos={pos}
              bend={bend}
              onPick={(to) => {
                settle(Math.round(pos.get()) + Math.round(dist(to, pos.get())));
              }}
            />
          ))}
        </div>
      </motion.div>

      <div className="flex items-end justify-between gap-4 px-6">
        <div className="grid min-h-16 overflow-clip" aria-live="polite">
          <AnimatePresence initial={false}>
            <motion.div
              key={s.slug}
              initial={still ? false : { y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={still ? { opacity: 0, transition: { duration: 0 } } : { y: "-60%", opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="col-start-1 row-start-1"
            >
              <p className="font-mono text-xs tracking-[0.2em] text-(--em-ink-400) uppercase">
                {s.kicker}
              </p>
              <p className="font-heading text-3xl font-black @2xl:text-4xl">{s.title}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex gap-2">
          {(
            [
              [-1, "ก่อนหน้า", ArrowLeft],
              [1, "ถัดไป", ArrowRight],
            ] as const
          ).map(([by, label, Icon]) => (
            <button
              key={by}
              type="button"
              aria-label={label}
              onClick={() => {
                step(by);
              }}
              className="grid size-11 place-items-center rounded-md border border-(--em-ink-700) hover:bg-(--em-ink-800) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
            >
              <Icon className="size-5" aria-hidden />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
