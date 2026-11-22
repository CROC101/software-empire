"use client";

import { GridPulse, MarqueeHero, ShinyTextOriginal, TechText, useTokenColors } from "@empire/ui";

// The hub hero from 2026-11-22 until Provably replaced it: GridPulse behind, the headline in
// React Bits Shiny Text on dark and Tech Text on light, a band of screenshots along the bottom.
const LINES = ["ระบบที่ผมสร้าง", "ทำงานได้จริง"];
const SHOTS = ["hub", "community", "tarot", "canva", "design", "toolboxes"].map((slug) => ({
  src: `/previews/${slug}.webp`,
  alt: slug,
}));
const INK = ["--em-ink-900", "--em-blue-600", "--em-blue-500"] as const;

function Title() {
  // canvas cannot read var(), so the light-theme ink is resolved first
  const ink = useTokenColors(INK);
  return (
    <span aria-hidden className="block">
      <span className="hidden [.dark_&]:block">
        {LINES.map((line, i) => (
          <span key={line} className="block">
            <ShinyTextOriginal
              text={line}
              color={i === 1 ? "var(--em-blue-500)" : "var(--em-ink-300)"}
              shineColor="var(--em-ink-0)"
              speed={3}
            />
          </span>
        ))}
      </span>
      <span className="block [.dark_&]:hidden">
        {LINES.map((line, i) => (
          <span key={line} className="block h-16 md:h-24">
            {ink && (
              <TechText
                text={line}
                fontWeight={900}
                fontSize={96}
                letterSpacing={0}
                color={i === 1 ? ink[1] : ink[0]}
                accentColor={ink[2]}
              />
            )}
          </span>
        ))}
      </span>
    </span>
  );
}

export default function Part() {
  return (
    <MarqueeHero
      eyebrow={
        <>
          <span className="font-mono text-[11px] font-semibold tracking-widest uppercase">
            crocwork studio
          </span>
          <span>ซอฟต์แวร์ · AI · ระบบหลังบ้าน</span>
        </>
      }
      lines={LINES}
      title={<Title />}
      background={<GridPulse className="vt-live" />}
      lead="ล็อกอินครั้งเดียว ใช้ได้ทุกระบบ"
      shots={SHOTS}
    >
      <a href="#subsystems" className="rounded-md bg-primary px-5 py-2.5 text-primary-foreground">
        ดูผลงาน
      </a>
      <a href="#login" className="rounded-md border px-5 py-2.5">
        ลองเล่นดู
      </a>
    </MarqueeHero>
  );
}
