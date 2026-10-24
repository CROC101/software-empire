"use client";

import { MurmurationWordmark, useTokenColors } from "@empire/ui";

/**
 * Before the team section: thousands of starlings (the many roles) that keep closing into one
 * word. Sky top and bottom are --em-ink-975, so the band runs on from the dark how-band and meets
 * the torn edge below without a seam; crocwork blue glows from the horizon.
 */
export function SoloFlock() {
  const colors = useTokenColors(["--em-ink-975", "--em-blue-600", "--em-ink-0"]);
  const [sky, glow, ink] = colors ?? [];
  return (
    <div className="bg-[var(--em-ink-975)]" style={{ height: "min(72svh, 640px)" }}>
      {sky && glow && ink && (
        <MurmurationWordmark
          word="SOLO"
          birds={2800}
          preset="night"
          palette={{ skyTop: sky, skyLow: sky, sun: glow, ink }}
          reeds={false}
          flyFor={6}
          holdFor={3.4}
          fontFamily='"Plus Jakarta Sans UI", "Noto Sans Thai UI", sans-serif'
          height="100%"
        >
          <div className="mx-auto flex h-full max-w-6xl flex-col justify-between px-4 py-10 text-[var(--em-ink-0)] sm:px-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--em-blue-500)]">
              many hands · one person
            </p>
            <p className="max-w-sm text-sm text-[var(--em-ink-300)]">
              หลายตำแหน่ง รวมอยู่ในคนเดียว · ชี้เมาส์แล้วฝูงนกจะแตกหนี
            </p>
          </div>
        </MurmurationWordmark>
      )}
    </div>
  );
}
