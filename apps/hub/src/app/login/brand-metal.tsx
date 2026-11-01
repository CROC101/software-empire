"use client";

import { MetallicPaint, useTokenColors } from "@empire/ui";

/**
 * The S-wave mark poured in liquid silver chrome, the reflections running
 * along it like water and tilting toward the pointer. Sits on the dark brand panel.
 */
export function BrandMetal() {
  const tint = useTokenColors(["--em-ink-100"])?.[0];
  return (
    <div className="relative mx-auto aspect-[7/8] w-full max-w-[16rem]">
      {tint && (
        <MetallicPaint
          imageSrc="/crocwork-logo.webp"
          color={tint}
          scale={0.78}
          density={2.2}
          edgeBend={0.75}
          dispersion={0.35}
          speed={0.7}
        />
      )}
    </div>
  );
}
