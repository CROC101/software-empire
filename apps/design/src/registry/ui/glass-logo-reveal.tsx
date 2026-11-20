"use client";

import { GlassIconReveal, useTokenColors } from "@empire/ui";

/** A glass droplet lands on the logo, bends it into colour at its rim, then lets go. Click to play again. */
export default function GlassLogoReveal({ hold = 2 }: { hold?: number }) {
  const bg = useTokenColors(["--background"])?.[0];
  return (
    <div className="grid size-full min-h-[28rem] place-items-center bg-background p-6">
      {bg && (
        <GlassIconReveal
          key={`${bg}-${String(hold)}`}
          logo="/crocwork-logo.webp"
          label="โลโก้ crocwork.studio"
          look={parseInt(bg.slice(1, 3), 16) < 128 ? "dark" : "light"}
          background={bg}
          plateColor={bg}
          originalColors
          loop
          hold={hold}
          tileSize={220}
          finalScale={0.95}
          className="h-[24rem] w-full max-w-xl"
        />
      )}
    </div>
  );
}
