"use client";

import { CurvedLens } from "@empire/ui";

const slides = [
  ["aurora-tide", "Shader", "Aurora Tide"],
  ["deep-galaxy", "Particles", "Deep Galaxy"],
  ["where-globe", "Map", "Where Globe"],
  ["warp-lanes", "Canvas", "Warp Lanes"],
  ["ripple-pond", "Water", "Ripple Pond"],
  ["tide-plasma", "Shader", "Tide Plasma"],
  ["particle-title", "Type", "Particle Title"],
  ["ripple-mesh", "Mesh", "Ripple Mesh"],
].map(([slug, kicker, title]) => ({ image: `/orbit/${slug}.webp`, kicker, title: title ?? "" }));

export default function CurvedLensPart({ bend = 1 }: { bend?: number }) {
  return <CurvedLens slides={slides} bend={bend} />;
}
