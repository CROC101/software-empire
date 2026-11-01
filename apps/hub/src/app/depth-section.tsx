"use client";

import { ParallaxLayers, ScrollFloat } from "@empire/ui";
import { subsystems } from "@/lib/subsystems";

const STARS = Array.from({ length: 60 }, (_, i) => ({
  // deterministic scatter so server and client render the same sky
  left: (i * 37) % 100,
  top: (i * 61) % 70,
  size: (i % 3) + 1,
}));

/** "One-person enterprise" depth header: sky, glow, title, then the 7 apps as a skyline. */
export function DepthSection() {
  return (
    <ParallaxLayers
      className="bg-[var(--em-ink-975)] text-[var(--em-ink-0)]"
      layers={[
        {
          depth: 70,
          node: (
            <div aria-hidden className="size-full">
              {STARS.map((s, i) => (
                <span
                  key={i}
                  className="absolute rounded-full bg-[var(--em-ink-0)]/70"
                  style={{
                    left: `${String(s.left)}%`,
                    top: `${String(s.top)}%`,
                    width: s.size,
                    height: s.size,
                  }}
                />
              ))}
            </div>
          ),
        },
        {
          depth: 55,
          node: (
            <div
              aria-hidden
              className="absolute left-1/2 top-[18%] size-[42rem] -translate-x-1/2 rounded-full blur-3xl"
              style={{
                background: "radial-gradient(circle, var(--em-blue-500), transparent 65%)",
                opacity: 0.45,
              }}
            />
          ),
        },
        {
          depth: 40,
          className: "flex flex-col items-center justify-center gap-3 px-4 text-center",
          node: (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--em-blue-500)]">
                crocwork.studio
              </p>
              <h2 className="text-5xl font-black leading-none tracking-tight sm:text-8xl">
                <ScrollFloat>
                  One-person
                  <br />
                  Enterprise
                </ScrollFloat>
              </h2>
              <p className="max-w-2xl text-sm text-[var(--em-ink-300)]">
                PM · Tech Lead · AI Engineer · Designer · DBA · DevOps · QA
                <br />
                ตำแหน่งพวกนี้ในบริษัทใหญ่คือเจ็ดคน ที่นี่คือผมคนเดียว ทำมาแล้ว {
                  subsystems.length
                }{" "}
                ระบบ
              </p>
            </>
          ),
        },
        {
          depth: 10,
          className: "flex items-end",
          node: (
            // the apps as a city skyline: one tower per subsystem, tinted with its accent
            <div
              aria-hidden
              className="flex h-[38%] w-full items-end justify-center gap-[1.5%] px-[4%]"
            >
              {subsystems.map((app, i) => (
                <div
                  key={app.slug}
                  className="flex-1 rounded-t-lg"
                  style={{
                    height: `${String(45 + ((i * 29) % 55))}%`,
                    background: `linear-gradient(to top, var(--em-ink-950), color-mix(in oklch, ${app.accent} 55%, var(--em-ink-950)))`,
                  }}
                />
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}
