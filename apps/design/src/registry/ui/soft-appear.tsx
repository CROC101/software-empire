"use client";

import { FadeContent } from "@empire/ui";
import { useState } from "react";

type Effect = "tide" | "focus" | "develop" | "mist" | "fade";

/**
 * Cards come in one after another with the site's fade presets (rise from the water, blur to sharp,
 * grey to colour, haze or a plain fade). Built on FadeContent from @empire/ui.
 */
export default function SoftAppear({
  effect = "tide",
  stagger = 0.12,
  blur = false,
}: {
  effect?: Effect;
  stagger?: number;
  blur?: boolean;
}) {
  const [run, setRun] = useState(0);
  return (
    <div className="grid size-full min-h-72 content-center justify-items-center gap-4 bg-(--em-ink-975) p-6">
      <FadeContent
        key={`${effect}-${String(stagger)}-${String(blur)}-${String(run)}`}
        effect={effect}
        stagger={stagger}
        blur={blur}
        trigger="mount"
        className="grid w-full max-w-md grid-cols-3 gap-3"
      >
        {["ออกแบบ", "เขียนโค้ด", "ส่งงาน"].map((w, i) => (
          <div
            key={w}
            className="aspect-square rounded-lg border border-(--em-ink-800) bg-linear-to-b from-(--em-blue-700) to-(--em-ink-900) p-3"
          >
            <p className="font-mono text-xs text-(--em-sky-400)">0{i + 1}</p>
            <p className="mt-1 font-heading text-lg font-black text-(--em-ink-50)">{w}</p>
          </div>
        ))}
      </FadeContent>
      <button
        type="button"
        onClick={() => {
          setRun((r) => r + 1);
        }}
        className="rounded-md border border-(--em-ink-700) px-3 py-1.5 text-sm text-(--em-ink-300) transition-colors hover:text-(--em-ink-50)"
      >
        อีกครั้ง
      </button>
    </div>
  );
}
