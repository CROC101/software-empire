"use client";

import { MarqueeHero } from "@empire/ui";

// design has no subsystem screenshots of its own, so the band uses the orbit shots
const shots = [
  "aurora-tide",
  "deep-galaxy",
  "where-globe",
  "warp-lanes",
  "ripple-pond",
  "tide-plasma",
].map((slug) => ({ src: `/orbit/${slug}.webp`, alt: slug }));

export default function MarqueeHeroPart({
  chip = "crocwork studio",
  line1 = "ระบบที่ผมสร้าง",
  line2 = "ทำงานได้จริง",
  lead = "ล็อกอินครั้งเดียว ใช้ได้ทุกระบบ",
  seconds = 60,
}: {
  chip?: string;
  line1?: string;
  line2?: string;
  lead?: string;
  seconds?: number;
}) {
  return (
    <MarqueeHero eyebrow={chip} lines={[line1, line2]} lead={lead} shots={shots} seconds={seconds}>
      <a
        href="#"
        className="inline-flex bg-(--em-blue-600) text-(--em-ink-0) hover:bg-(--em-blue-700) items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"
      >
        ดูผลงาน <span aria-hidden>↓</span>
      </a>
      <a
        href="#"
        className="inline-flex items-center rounded-xl border px-5 py-3 text-sm font-bold"
      >
        ลองเล่นดู
      </a>
    </MarqueeHero>
  );
}
