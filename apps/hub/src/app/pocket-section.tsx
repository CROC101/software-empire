"use client";

import { PhoneScrollHero, ScreenRail, useAutoplay, useReducedMotionAfterMount } from "@empire/ui";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import { useState } from "react";

const EYEBROW = "font-mono text-xs uppercase tracking-[0.2em]";

// real phone screens, one under the other: the page scroll scrolls the phone too
const FEED = [
  ["/previews/m-community.webp", "Community", "ฟีด"],
  ["/previews/m-messages.webp", "Community", "แชตเรียลไทม์"],
  ["/previews/m-canva.webp", "Empire Canvas", "หน้าแรก"],
  ["/previews/m-toolboxes.webp", "Toolboxes", "หน้าแรก"],
  ["/previews/m-tools.webp", "Toolboxes", "เครื่องมือ"],
] as const;
const START = 0.35; // the phone straightens and climbs first; the screens start playing after

function Feed({ active }: { active: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      {FEED.map(([src, app, screen], i) => {
        // the current screen and its neighbours only: 100 screens still load 3 images
        const d = Math.abs(i - active);
        if (d > 1 && d < FEED.length - 1) return null;
        const on = i === active;
        return (
          <Image
            key={src}
            src={src}
            alt={on ? `${app} · ${screen}` : ""}
            aria-hidden={!on}
            width={390}
            height={844}
            sizes="(min-width: 768px) 17rem, 15rem"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover object-top transition-[opacity,transform] duration-700 ease-out"
            style={{ opacity: on ? 1 : 0, transform: on ? "none" : "translateY(3%) scale(1.02)" }}
          />
        );
      })}
    </div>
  );
}

// what each app does on a phone, floating at different depths around it (true facts only)
const CHIPS = [
  // tops are below the headline, beside the phone
  { text: "Community · แชตเรียลไทม์", side: "left", top: "calc(100% + 5rem)", depth: 1 },
  { text: "Toolboxes · 121 เครื่องมือ", side: "right", top: "calc(100% + 9rem)", depth: 2 },
  { text: "Empire Canvas · หลายเลเยอร์", side: "left", top: "calc(100% + 15rem)", depth: 3 },
  { text: "ธีมสว่าง · มืด ตามเครื่อง", side: "right", top: "calc(100% + 19rem)", depth: 1 },
] as const;

/**
 * The headline with depth: the words stand out of the page (a stacked, extruded shadow), two
 * outline echoes stretch away behind them and drift slower than the page, and glass chips float
 * around the phone at their own depths. Transforms only, on the scene's own progress.
 */
function DepthTitle({ progress }: { progress: MotionValue<number> }) {
  const far = useTransform(progress, [0, 1], [-34, -150]);
  const chipY = [
    useTransform(progress, [0, 1], [30, -40]),
    useTransform(progress, [0, 1], [50, -80]),
    useTransform(progress, [0, 1], [80, -130]),
  ];
  const words = (
    <>
      บนมือถือ
      <br />
      หน้าตาแบบนี้
    </>
  );
  const size = "text-5xl leading-[0.95] font-black tracking-tight sm:text-7xl md:text-8xl";
  return (
    <div className="relative">
      {/* echoes: the same words, outlined, receding behind */}
      {/* echo: the same words, outlined and larger, far behind, drifting slower than the page */}
      <motion.p
        aria-hidden
        style={{ y: far, scale: 1.45 }}
        className={`pointer-events-none absolute inset-x-0 top-3 -z-10 select-none text-transparent ${size}`}
      >
        <span
          style={{
            WebkitTextStroke: "1.5px color-mix(in oklab, var(--em-blue-500) 14%, transparent)",
          }}
        >
          {words}
        </span>
      </motion.p>
      <h2 className={`pk-depth mt-3 ${size}`}>
        บนมือถือ
        <br />
        <span className="pk-depth-blue">หน้าตาแบบนี้</span>
      </h2>
      {CHIPS.map((c, i) => (
        <motion.span
          key={c.text}
          aria-hidden
          style={{ y: chipY[c.depth - 1], top: c.top }}
          className={`absolute hidden items-center gap-2 rounded-full border bg-background/70 px-3.5 py-2 text-sm font-semibold whitespace-nowrap shadow-[0_12px_30px_-12px_color-mix(in_oklab,var(--em-blue-700)_45%,transparent)] backdrop-blur-md md:inline-flex ${
            c.side === "left" ? "right-[calc(50%+9.5rem)]" : "left-[calc(50%+9.5rem)]"
          }`}
        >
          <span
            className="size-2 rounded-full"
            style={{ background: i % 2 ? "var(--em-violet-500)" : "var(--em-blue-500)" }}
          />
          {c.text}
        </motion.span>
      ))}
    </div>
  );
}

/** Tells the section when the phone has settled, so the screens start (and stop when scrolled away). */
function Watch({
  progress,
  onLive,
}: {
  progress: MotionValue<number>;
  onLive: (live: boolean) => void;
}) {
  useMotionValueEvent(progress, "change", (p) => {
    onLive(p >= START && p < 0.995);
  });
  return null;
}

/**
 * The phone twin of the notebook preview: the scroll straightens the phone and lifts it over the
 * headline; then its real mobile screens play on their own, and a row of buttons under the phone
 * picks any of them. The scroll length stays the same however many screens there are.
 */
export function PocketSection() {
  const [active, setActive] = useState(0);
  const [live, setLive] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotionAfterMount();
  useAutoplay(FEED.length, active, setActive, live && !paused && !reduced, 3800);
  return (
    <section id="pocket" aria-label="บนมือถือ" className="relative">
      <PhoneScrollHero
        overlap={24}
        tilt={26}
        titleComponent={(progress) => (
          <>
            {/* blue glow that sits behind the phone as it climbs */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-full left-1/2 -z-10 size-[34rem] -translate-x-1/2 -translate-y-1/3 rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(closest-side, color-mix(in oklab, var(--em-blue-500) 20%, transparent), transparent)",
              }}
            />
            <p className={`${EYEBROW} cw-blue`}>in your pocket</p>
            <DepthTitle progress={progress} />
            <Watch progress={progress} onLive={setLive} />
          </>
        )}
        pinned
        phoneClassName="w-[11.5rem] sm:w-[13rem] md:w-[14.5rem]"
        className="h-[200vh]"
        footer={
          <div
            className="mx-auto mt-5 w-full max-w-md px-4"
            onPointerEnter={() => {
              setPaused(true);
            }}
            onPointerLeave={() => {
              setPaused(false);
            }}
          >
            <ScreenRail
              label="เลือกหน้าจอบนมือถือ"
              active={active}
              onPick={(i) => {
                setActive(i);
                setPaused(true);
              }}
              items={FEED.map(([src, app, screen]) => ({ key: src, label: `${app} · ${screen}` }))}
              className="justify-start"
            />
          </div>
        }
      >
        <Feed active={active} />
      </PhoneScrollHero>
    </section>
  );
}
