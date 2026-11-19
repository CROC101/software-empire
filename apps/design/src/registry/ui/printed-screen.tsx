"use client";

import { HalftoneReveal, useTokenColors } from "@empire/ui";

const TOKENS = ["--em-ink-100", "--em-blue-500", "--em-ink-975"] as const;

/** A screenshot printed as two-ink halftone; where the pointer passes, the dots swell into the real screen underneath. */
export default function PrintedScreen({
  src = "/previews/hub.webp",
  cellSize = 7,
  revealRadius = 170,
  wander = true,
}: {
  src?: string;
  /** dot spacing in px */
  cellSize?: number;
  revealRadius?: number;
  /** untouched, a glint drifts across by itself */
  wander?: boolean;
}) {
  const colors = useTokenColors(TOKENS);
  const [ink, accent, paper] = colors ?? [];
  return (
    <div className="size-full min-h-56 bg-(--em-ink-975)">
      {ink && accent && paper && (
        <HalftoneReveal
          src={src}
          fit="cover"
          mode="duotone"
          shape="dot"
          cellSize={cellSize}
          angle={45}
          inkColor={ink}
          accentColor={accent}
          paperColor={paper}
          misregistration={0.25}
          revealRadius={revealRadius}
          linger={1.4}
          wander={wander}
          label="ภาพหน้าจอพิมพ์เป็นเม็ดสกรีน ขยับเมาส์เพื่อดูหน้าจอจริงข้างใต้"
          className="size-full"
        />
      )}
    </div>
  );
}
