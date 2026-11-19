"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { defaults, kindOf, type Entry } from "@/registry/meta";
import { Part } from "@/registry/parts";

/**
 * Renders its child at a fixed desktop width and scales it down to the box, so a block or a whole
 * page reads as a thumbnail with its real desktop layout. Thumbnails are inert: no focus, no clicks.
 */
export function ScaledFrame({ width = 1024, children }: { width?: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      if (e) setScale(e.contentRect.width / width);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [width]);
  return (
    <div ref={box} className="relative size-full overflow-hidden">
      {scale > 0 && (
        <div
          inert
          className="pointer-events-none absolute top-0 left-0 origin-top-left"
          style={{ width, transform: `scale(${String(scale)})` }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** Card thumbnail: components play live on the ink stage, blocks and pages show scaled down in the site theme. */
export function Thumb({ entry }: { entry: Entry }) {
  if (kindOf(entry) === "component")
    return (
      <div className="size-full bg-(--em-ink-975) [&>*]:h-full">
        <Part slug={entry.slug} values={defaults(entry)} />
      </div>
    );
  return (
    <div className="size-full bg-background">
      <ScaledFrame>
        <Part slug={entry.slug} values={defaults(entry)} />
      </ScaledFrame>
    </div>
  );
}
