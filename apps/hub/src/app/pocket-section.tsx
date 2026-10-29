"use client";

import { PhoneScrollHero, ScreenRail, useAutoplay, useReducedMotionAfterMount } from "@empire/ui";
import { useMotionValueEvent, type MotionValue } from "motion/react";
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
            <h2 className="mt-3 text-4xl leading-[0.95] font-black tracking-tight sm:text-6xl md:text-7xl">
              บนมือถือ
              <br />
              <span className="cw-blue">หน้าตาแบบนี้</span>
            </h2>
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
