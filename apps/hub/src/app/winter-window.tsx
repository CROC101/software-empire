"use client";

import { HoarfrostPane, useAmbience } from "@empire/ui";

const EYEBROW = "font-mono text-xs uppercase tracking-[0.2em]";

/**
 * A winter interlude: only while the sky is the cool season or Christmas (picked in the sky
 * menu, or by date on ตามฤดูกาล), a frosted window over a blue-hour street. Wipe the glass and
 * the frost grows back. Gone the rest of the year, so it costs nothing then.
 */
export function WinterWindow() {
  const { season } = useAmbience();
  if (season !== "snow" && season !== "christmas") return null;
  return (
    <section id="winter" aria-label="หน้าหนาว" className="relative">
      <HoarfrostPane height="min(78svh, 720px)" coverage={0.62}>
        <div className="flex h-full flex-col items-center justify-center px-6 text-center text-[var(--em-ink-0)]">
          <p className={`${EYEBROW} text-[var(--em-ink-0)]/60`}>
            {season === "christmas" ? "merry christmas" : "cool season"}
          </p>
          <h2 className="mt-4 text-5xl font-black tracking-tight [text-shadow:0_2px_28px_rgb(8_14_28/0.65)] sm:text-7xl">
            หน้าหนาว<span className="text-[var(--em-sky-500)]">มาแล้ว</span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-[var(--em-ink-0)]/70">
            ลากนิ้วหรือเมาส์ผ่านกระจก น้ำแข็งจะละลายเป็นทาง แล้วค่อย ๆ กลับมาเกาะใหม่
          </p>
        </div>
      </HoarfrostPane>
    </section>
  );
}
