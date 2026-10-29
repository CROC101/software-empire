"use client";

import { PhoneScrollHero } from "@empire/ui";
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
const START = 0.12; // the phone straightens a little before its screen starts to move

const at = (p: number) =>
  Math.min(
    FEED.length - 1,
    Math.max(0, Math.round(((p - START) / (1 - START)) * (FEED.length - 1))),
  );

function Feed({ progress }: { progress: MotionValue<number> }) {
  const y = useTransform(
    progress,
    [START, 1],
    ["0%", `-${String(((FEED.length - 1) / FEED.length) * 100)}%`],
  );
  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      <motion.div style={{ y }} className="flex flex-col">
        {FEED.map(([src, app, screen]) => (
          <Image
            key={src}
            src={src}
            alt={`${app} · ${screen}`}
            width={390}
            height={844}
            sizes="(min-width: 768px) 17rem, 15rem"
            draggable={false}
            className="block h-auto w-full"
          />
        ))}
      </motion.div>
    </div>
  );
}

function NowOnScreen({ progress }: { progress: MotionValue<number> }) {
  const [i, setI] = useState(0);
  useMotionValueEvent(progress, "change", (p) => {
    const next = at(p);
    setI((cur) => (cur === next ? cur : next));
  });
  const [, app, screen] = FEED[i] ?? FEED[0];
  return (
    <p
      aria-live="polite"
      // beside the phone, level with its screen, so the phone never covers it
      className="absolute top-full left-[calc(50%+9rem)] mt-40 hidden items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-sm whitespace-nowrap shadow-sm backdrop-blur md:inline-flex"
    >
      <span className="size-2 rounded-full bg-[var(--em-blue-500)]" aria-hidden />
      <span className="font-semibold">{app}</span>
      <span className="text-muted-foreground">· {screen}</span>
      <span className="font-mono text-xs text-muted-foreground">
        {i + 1}/{FEED.length}
      </span>
    </p>
  );
}

/**
 * The phone twin of the notebook preview: the phone straightens and climbs over the headline
 * while its own screen scrolls through the real mobile screens, both on the page scroll.
 */
export function PocketSection() {
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
            <NowOnScreen progress={progress} />
          </>
        )}
        pinned
        phoneClassName="w-[11.5rem] sm:w-[13rem] md:w-[14.5rem]"
      >
        {(progress) => <Feed progress={progress} />}
      </PhoneScrollHero>
    </section>
  );
}
