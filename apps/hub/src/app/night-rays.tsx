"use client";

import { LightRays, useTokenColors } from "@empire/ui";

const TOKENS = ["--background", "--em-ink-100"] as const;

/**
 * Night only: moonlight pours from the top of the screen (a little toward the right, where the
 * tree's moon hangs) and spreads softly over the whole width, cooling to blue as it falls, with
 * dust drifting in the shafts. By day there is nothing to draw, so the canvas is not mounted.
 */
export function NightRays() {
  const colors = useTokenColors(TOKENS);
  if (!colors) return null;
  const [bg = "#ffffff", moon = "#eeeeee"] = colors;
  if (parseInt(bg.slice(1, 3), 16) >= 128) return null;
  return (
    // edge to edge of the screen, not the hero's column; above the tree (its canvas paints its
    // own sky) but only adding light; it thins out toward the bottom so there is no edge
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-screen -translate-x-1/2 mix-blend-screen [mask-image:linear-gradient(to_bottom,#000_55%,transparent)]"
    >
      <LightRays
        raysOrigin="top-center"
        raysColor={moon}
        tilt={-12}
        lightSpread={1.6}
        rayLength={2.4}
        fadeDistance={1.4}
        rayDensity={1.2}
        raySharpness={0.25}
        haze={0.45}
        glow={0.55}
        atmosphere={1}
        intensity={0.9}
        raysSpeed={0.6}
        mouseInfluence={0.06}
        cursorShadow={false}
        clickPulse={false}
        opacity={0.8}
      />
    </div>
  );
}
