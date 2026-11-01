"use client";

import { HalftoneReveal, useTokenColors } from "@empire/ui";

const TOKENS = ["--foreground", "--em-blue-600", "--background"] as const;

/**
 * "Real screens, not mock-ups", acted out: the hub's own screenshot printed as a two-ink
 * halftone, like a mock-up in an ad, and wherever the pointer (or, untouched, a drifting glint)
 * passes, the dots swell into the real screen underneath.
 */
export function PrintedScreen() {
  const colors = useTokenColors(TOKENS);
  const [ink, accent, paper] = colors ?? [];
  return (
    <div className="mb-16 aspect-[16/9] w-full overflow-hidden rounded-xl border sm:aspect-[21/9]">
      {ink && accent && paper && (
        <HalftoneReveal
          src="/previews/hub.webp"
          fit="cover"
          mode="duotone"
          shape="dot"
          cellSize={7}
          angle={45}
          inkColor={ink}
          accentColor={accent}
          paperColor={paper}
          misregistration={0.25}
          revealRadius={170}
          linger={1.4}
          wander
          label="ภาพหน้าจอ hub พิมพ์เป็นเม็ดสกรีน ขยับเมาส์เพื่อดูหน้าจอจริงข้างใต้"
        />
      )}
    </div>
  );
}
