"use client";

import { SideRays, useTokenColors } from "@empire/ui";

const TOKENS = ["--background", "--em-ink-100", "--em-sky-500"] as const;

/**
 * Night only: moonlight falls from the top right corner of the hero (where the tree's moon
 * hangs) across the headline, a pale beam and a blue one, leaning a little toward the pointer.
 * By day there is nothing to draw, so the canvas is not even mounted.
 */
export function NightRays() {
  const colors = useTokenColors(TOKENS);
  if (!colors) return null;
  const [bg = "#ffffff", moon = "#eeeeee", blue = "#3b82f6"] = colors;
  if (parseInt(bg.slice(1, 3), 16) >= 128) return null;
  return (
    // above the tree (its canvas paints its own sky) but only adding light: screen blend
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 -right-16 z-10 mix-blend-screen [mask-image:linear-gradient(to_left,transparent,#000_5rem)]"
    >
      <SideRays
        rayColor1={moon}
        rayColor2={blue}
        origin="top-right"
        blend={0.55}
        intensity={2.4}
        spread={2}
        density={4}
        falloff={1.25}
        glow={0.6}
        dust={0.35}
        mouseInfluence={0.25}
        opacity={0.85}
      />
    </div>
  );
}
