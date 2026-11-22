"use client";

import { ShinyTextOriginal, TechText, useTokenColors } from "@empire/ui";

const INK = ["--em-ink-900", "--em-blue-600", "--em-blue-500"] as const;

// React Bits originals, one per theme: Shiny Text on dark, Tech Text on light.
// The other one is display:none, so its canvas / loop sleeps.
export function HeroTitle({ lines }: { lines: string[] }) {
  // canvas cannot read var(), so the light-theme ink is resolved first
  const ink = useTokenColors(INK);
  return (
    <span aria-hidden className="block">
      <span className="hidden [.dark_&]:block">
        {lines.map((line, i) => (
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
        {lines.map((line, i) => (
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
