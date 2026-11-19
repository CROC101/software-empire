"use client";

import { SideRays, useTokenColors } from "@empire/ui";

const TOKENS = ["--em-ink-100", "--em-sky-500"] as const;

/** Moonlight fans in from the top-right corner over night water, two layers of shafts with dust, leaning toward the pointer. */
export default function MoonRays({
  speed = 1.2,
  intensity = 2.2,
  dust = 0.35,
  follow = true,
}: {
  speed?: number;
  intensity?: number;
  /** specks drifting in the light */
  dust?: number;
  /** the shafts lean toward the pointer */
  follow?: boolean;
}) {
  const colors = useTokenColors(TOKENS);
  const [moon, sky] = colors ?? [];
  return (
    <div className="relative isolate size-full min-h-56 overflow-hidden bg-linear-to-b from-(--em-blue-700) to-(--em-ink-975)">
      {moon && sky && (
        <SideRays
          origin="top-right"
          rayColor1={moon}
          rayColor2={sky}
          blend={0.45}
          speed={speed}
          intensity={intensity}
          spread={2.2}
          density={5}
          sharpness={0.45}
          falloff={1.3}
          glow={0.8}
          dust={dust}
          followMouse={follow}
          mouseInfluence={0.35}
        />
      )}
    </div>
  );
}
