"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const lines = [
  "$ pnpm add @crocwork/ui",
  "+ @crocwork/ui 2.4.0",
  "$ crocwork init --theme tide",
  "✓ ธีม tide พร้อมใช้",
  "$ crocwork add hero-terminal",
  "✓ เพิ่ม 1 ชิ้นส่วนแล้ว",
];

/** Headline beside a terminal that types its commands line by line, then rests on a blinking caret. */
export default function HeroTerminal({
  title = "ติดตั้งครั้งเดียว ใช้ได้ทุกแอป",
}: {
  title?: string;
}) {
  const still = useReducedMotion();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (still) return;
    const t = setInterval(() => {
      setShown((n) => (n >= lines.length ? n : n + 1));
    }, 700);
    return () => {
      clearInterval(t);
    };
  }, [still]);
  const count = still ? lines.length : shown;
  return (
    <section className="bg-background text-foreground @container">
      <style>{`@keyframes hero-terminal-blink{50%{opacity:0}}.hero-terminal-caret{animation:hero-terminal-blink 1s steps(1) infinite}@media (prefers-reduced-motion:reduce){.hero-terminal-caret{animation:none}}`}</style>
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 @3xl:grid-cols-[1fr_1.1fr] @3xl:py-24">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            for developers
          </p>
          <h1 className="mt-4 font-heading text-4xl leading-tight font-black @3xl:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-md text-muted-foreground">
            คำสั่งเดียวได้ชิ้นส่วนพร้อมธีม ไม่ต้องตั้งค่าเอง โค้ดเป็นของคุณ แก้ได้ทุกบรรทัด
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-(--em-ink-800) bg-(--em-ink-975) shadow-2xl">
          <div className="flex items-center gap-1.5 border-b border-(--em-ink-800) px-4 py-3">
            {["bg-(--em-coral-500)", "bg-(--em-gold-500)", "bg-(--em-teal-400)"].map((c) => (
              <span key={c} className={`size-2.5 rounded-full ${c}`} />
            ))}
            <span className="ml-3 font-mono text-xs text-(--em-ink-400)">~/my-app</span>
          </div>
          <pre
            aria-label="ตัวอย่างคำสั่ง"
            className="min-h-56 overflow-x-auto p-5 font-mono text-sm leading-7"
          >
            {lines.slice(0, count).map((l) => (
              <div
                key={l}
                className={l.startsWith("$") ? "text-(--em-ink-100)" : "text-(--em-sky-400)"}
              >
                {l}
              </div>
            ))}
            <span
              aria-hidden
              className="hero-terminal-caret inline-block h-4 w-2 translate-y-0.5 bg-(--em-ink-100)"
            />
          </pre>
        </div>
      </div>
    </section>
  );
}
