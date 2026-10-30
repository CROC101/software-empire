"use client";

import { DataRain, useAmbience, useTokenColors } from "@empire/ui";

const EYEBROW = "font-mono text-xs uppercase tracking-[0.2em]";
// the rain in the studio's water colours: calm sky, mid blue, hot violet where it races past
const TOKENS = ["--em-sky-500", "--em-blue-500", "--em-violet-400"] as const;

/**
 * A rainy-season interlude: only while the sky is rain (picked in the sky menu, or by date on
 * ตามฤดูกาล), a pane of falling light that parts round the pointer like rain round a hand.
 * Rendered nothing the rest of the year.
 */
export function RainWindow() {
  const { season } = useAmbience();
  const c = useTokenColors(TOKENS);
  if (season !== "rain" || !c) return null;
  const [calm = "", mid = "", hot = ""] = c;
  return (
    <section
      id="rain"
      aria-label="หน้าฝน"
      className="relative isolate h-[min(78svh,720px)] overflow-hidden"
    >
      <DataRain fullscreen={false} palette={{ calm, mid, hot }} />
      <div className="pointer-events-none relative flex h-full flex-col items-center justify-center px-6 text-center text-[var(--em-ink-0)]">
        <p className={`${EYEBROW} text-[var(--em-sky-500)]`}>rainy season</p>
        <h2 className="mt-4 text-5xl font-black tracking-tight [text-shadow:0_2px_28px_rgb(2_3_8/0.8)] sm:text-7xl">
          หน้าฝน<span className="text-[var(--em-sky-500)]">ก็ไหลไปด้วยกัน</span>
        </h2>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-[var(--em-ink-0)]/70">
          ลากเมาส์หรือนิ้วผ่านสายฝน มันจะแยกทางหลบมือคุณเหมือนน้ำไหลอ้อมก้อนหิน
        </p>
      </div>
    </section>
  );
}
