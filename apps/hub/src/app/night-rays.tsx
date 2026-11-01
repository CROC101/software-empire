"use client";

import { SideRays, useTokenColors } from "@empire/ui";

const TOKENS = ["--background", "--em-ink-100", "--em-sky-500"] as const;

/**
 * Night only: moonlight fans in from the top-right corner, where the tree's moon hangs, two
 * layers of shafts (moon white over sky blue) with dust drifting in them, leaning toward the
 * pointer. Across the whole width of the hero; by day there is nothing to draw, so the canvas is
 * not mounted.
 */
export function NightRays() {
  const colors = useTokenColors(TOKENS);
  if (!colors) return null;
  const [bg = "#ffffff", moon = "#eeeeee", sky = "#3399ff"] = colors;
  if (parseInt(bg.slice(1, 3), 16) >= 128) return null;
  return (
    // edge to edge of the screen, not the hero's column; above the tree (its canvas paints its
    // own sky) but only adding light; it thins out toward the bottom so there is no edge
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-screen -translate-x-1/2 mix-blend-screen [mask-image:linear-gradient(to_bottom,#000_55%,transparent)]"
    >
      <SideRays
        origin="top-right"
        rayColor1={moon}
        rayColor2={sky}
        blend={0.45}
        speed={1.2}
        intensity={2.2}
        spread={2.2}
        density={5}
        sharpness={0.45}
        falloff={1.3}
        glow={0.8}
        dust={0.35}
        mouseInfluence={0.35}
        opacity={1}
      />
    </div>
  );
}
