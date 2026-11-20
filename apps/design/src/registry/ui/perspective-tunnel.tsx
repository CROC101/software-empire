"use client";

import { PerspectiveTunnel } from "@empire/ui";

const shots = [
  ["aurora-tide", "Aurora Tide"],
  ["deep-galaxy", "Deep Galaxy"],
  ["where-globe", "Where Globe"],
  ["warp-lanes", "Warp Lanes"],
  ["ripple-pond", "Ripple Pond"],
  ["dither-tide", "Dither Tide"],
  ["tide-plasma", "Tide Plasma"],
  ["ripple-mesh", "Ripple Mesh"],
  ["float-particles", "Float Particles"],
  ["particle-title", "Particle Title"],
] as const;

/** Scroll down and the cards fly past the camera from a far vanishing point, each one a link. */
export default function PerspectiveTunnelDemo() {
  return (
    <PerspectiveTunnel
      eyebrow={
        <p className="mb-4 font-mono text-xs tracking-[0.2em] text-(--em-blue-600) uppercase">
          fly-through
        </p>
      }
      title={
        <>
          บินเข้าไป
          <br />
          <span className="text-(--em-blue-600)">ในงานจริง</span>
        </>
      }
      body="ทุกใบคือชิ้นงานในคลัง กดใบไหนก็เปิดดูได้"
      prompt="เลื่อนลงเพื่อบินเข้าไป"
      items={shots.map(([slug, title]) => ({
        src: `/orbit/${slug}.webp`,
        title,
        href: `/c/${slug}`,
      }))}
    />
  );
}
